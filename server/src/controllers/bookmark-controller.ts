import Bookmark from '../models/bookmark-model'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

// Generalized function for bookmarking both dining and events
export const bookmarkItem = async (req: Request, res: Response) => {
  const { userId, sourceType, name, location, imageUrl, rating, totalReviews, airportId, eventTime, eventDescription } =
    req.body
  const itemId = sourceType === 'EVENT_API' ? req.body.eventId : req.body.diningId
  const externalAddress = req.body.externalAddress || null
  const eventLocationMap = req.body.eventLocationMap || null

  try {
    const newBookmark = new Bookmark({
      userId,
      [sourceType === 'EVENT_API' ? 'eventId' : 'diningId']: itemId,
      sourceType,
      airportId,
      name,
      location,
      imageUrl,
      rating,
      totalReviews,
      externalAddress,
      eventLocationMap,
      eventTime,
      eventDescription
    })
    const savedBookmark = await newBookmark.save()
    res.status(201).json(savedBookmark)
  } catch (error) {
    res.status(500).json({ error: 'Failed to bookmark item.' })
  }
}

// Generalized function for unbookmarking both dining and events
export const unbookmarkItem = async (req: Request, res: Response) => {
  const { userId, sourceType, airportId } = req.body
  const itemId = sourceType === 'EVENT_API' ? req.body.eventId : req.body.diningId

  try {
    await Bookmark.findOneAndDelete({
      userId,
      [sourceType === 'EVENT_API' ? 'eventId' : 'diningId']: itemId,
      airportId // Ensuring the bookmark is specific to this airport
    })
    res.status(200).json({ message: 'Unbookmarked successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to unbookmark' })
  }
}

// Fetch all bookmarks for a user
export const getUserBookmarks = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const bookmarks = await Bookmark.find({ userId }).populate('airportId') // Populate airportId for full details
    res.status(200).json(bookmarks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookmarks' })
  }
}

export const getUserEventBookmarks = async (req: Request, res: Response) => {
  const { userId } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const search = req.query.search as string | undefined

  try {
    // Define the aggregation pipeline
    const bookmarks = await Bookmark.aggregate([
      // Perform the lookup first to make `airportId` fields available for matching
      {
        $lookup: {
          from: 'airports', // the collection name for Airport model
          localField: 'airportId',
          foreignField: '_id',
          as: 'airportId'
        }
      },
      { $unwind: '$airportId' }, // Unwind the airportId array after lookup

      // Build the match stage after lookup so we can access `airportId` fields
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          sourceType: 'EVENT_API',
          ...(search && {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { 'airportId.city': { $regex: search, $options: 'i' } },
              { 'airportId.country': { $regex: search, $options: 'i' } },
              { 'airportId.name': { $regex: search, $options: 'i' } }
            ]
          })
        }
      },

      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },

      {
        $project: {
          'airportId.name': 1,
          'airportId.city': 1,
          'airportId.country': 1,
          _id: 1,
          name: 1,
          location: 1,
          imageUrl: 1,
          eventDescription: 1,
          externalAddress: 1,
          eventLocationMap: 1,
          eventTime: 1,
          createdAt: 1,
          updatedAt: 1
          // Include any other fields you need from the Bookmark schema here
        }
      }
    ])

    res.status(200).json(bookmarks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event bookmarks' })
  }
}

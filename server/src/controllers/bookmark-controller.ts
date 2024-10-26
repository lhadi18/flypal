import Bookmark from '../models/bookmark-model'
import { Request, Response } from 'express'

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
      airportId, // Added airportId
      name,
      location,
      imageUrl,
      rating,
      totalReviews,
      externalAddress,
      eventLocationMap,
      eventTime, // Added eventTime for events
      eventDescription // Added eventDescription for events
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

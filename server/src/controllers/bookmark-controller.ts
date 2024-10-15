// controllers/bookmark.controller.ts
import { generateDiningId } from '../utils/generate-dining-id'
import Bookmark from '../models/bookmark-model'
import { Request, Response } from 'express'

export const bookmarkDining = async (req: Request, res: Response) => {
  const { userId, restaurantName, location, sourceType, diningId } = req.body

  try {
    // Generate a diningId for API-based dining options if not provided
    let generatedDiningId = diningId
    if (sourceType === 'API' && !diningId) {
      generatedDiningId = generateDiningId(restaurantName, location)
    }

    // Check if the bookmark already exists
    const existingBookmark = await Bookmark.findOne({ userId, diningId: generatedDiningId })
    if (existingBookmark) {
      return res.status(400).json({ message: 'Already bookmarked' })
    }

    // Create a new bookmark
    const bookmark = new Bookmark({ userId, diningId: generatedDiningId, sourceType })
    await bookmark.save()

    res.status(201).json({ message: 'Bookmarked successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to bookmark' })
  }
}

export const unbookmarkDining = async (req: Request, res: Response) => {
  const { userId, diningId } = req.body

  try {
    await Bookmark.findOneAndDelete({ userId, diningId })
    res.status(200).json({ message: 'Unbookmarked successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to unbookmark' })
  }
}

export const getUserBookmarks = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const bookmarks = await Bookmark.find({ userId })
    res.status(200).json(bookmarks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookmarks' })
  }
}

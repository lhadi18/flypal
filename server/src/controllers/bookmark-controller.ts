// controllers/bookmark.controller.ts
import { generateDiningId } from '../utils/generate-dining-id'
import Bookmark from '../models/bookmark-model'
import { Request, Response } from 'express'

export const bookmarkDining = async (req: Request, res: Response) => {
  const { userId, diningId, sourceType, name, location, imageUrl, rating, totalReviews } = req.body
  try {
    const newBookmark = new Bookmark({
      userId,
      diningId,
      sourceType,
      name,
      location,
      imageUrl,
      rating,
      totalReviews
    })
    const savedBookmark = await newBookmark.save()
    res.status(201).json(savedBookmark)
  } catch (error) {
    res.status(500).json({ error: 'Failed to bookmark dining option.' })
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

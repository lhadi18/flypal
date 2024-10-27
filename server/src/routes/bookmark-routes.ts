// routes/bookmark.routes.ts
import {
  bookmarkItem,
  unbookmarkItem,
  getUserBookmarks,
  getUserEventBookmarks
} from '../controllers/bookmark-controller'
import express from 'express'

const router = express.Router()

router.post('/bookmark', bookmarkItem)
router.post('/unbookmark', unbookmarkItem)
router.get('/user/:userId', getUserBookmarks)
router.get('/user/:userId/events-paginated', getUserEventBookmarks)

export default router

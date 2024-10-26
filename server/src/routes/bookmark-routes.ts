// routes/bookmark.routes.ts
import { bookmarkItem, unbookmarkItem, getUserBookmarks } from '../controllers/bookmark-controller'
import express from 'express'

const router = express.Router()

router.post('/bookmark', bookmarkItem)
router.post('/unbookmark', unbookmarkItem)
router.get('/user/:userId', getUserBookmarks)

export default router

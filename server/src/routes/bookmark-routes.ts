// routes/bookmark.routes.ts
import { bookmarkDining, unbookmarkDining, getUserBookmarks } from '../controllers/bookmark-controller'
import express from 'express'

const router = express.Router()

router.post('/bookmark', bookmarkDining)
router.post('/unbookmark', unbookmarkDining)
router.get('/user/:userId', getUserBookmarks)

export default router

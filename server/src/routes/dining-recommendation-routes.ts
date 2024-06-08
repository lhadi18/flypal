import {
  addDiningRecommendation,
  deleteRecommendation,
  getCrewPicks,
  getUserRecommendations,
  likeRecommendation,
  updateDiningRecommendation
} from '../controllers/dining-recommendation-controller'
import express from 'express'
import multer from 'multer'

const router = express.Router()
const upload = multer()

router.post('/recommendations', upload.single('image'), addDiningRecommendation)
router.get('/crew-picks/:airportId', getCrewPicks)
router.post('/crew-picks/:id/like', likeRecommendation)
router.get('/user-recommendations/:userId', getUserRecommendations)
router.delete('/recommendation/:id', deleteRecommendation)
router.put('/recommendation/:id', upload.single('image'), updateDiningRecommendation) // New route for updating recommendation

export default router

import {
  addDiningRecommendation,
  getCrewPicks,
  likeRecommendation
} from '../controllers/dining-recommendation-controller'
import express from 'express'
import multer from 'multer'

const router = express.Router()
const upload = multer()

router.post('/recommendations', upload.single('image'), addDiningRecommendation)
router.get('/crew-picks/:airportId', getCrewPicks)
router.post('/crew-picks/:id/like', likeRecommendation)

export default router

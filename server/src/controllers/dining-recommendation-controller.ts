import DiningRecommendation from '../models/dining-recommendation-model'
import Airport from '../models/airport-model'
import { Request, Response } from 'express'
import { bucket } from '../services/gcs'
import { v4 as uuidv4 } from 'uuid'
import { Multer } from 'multer'

// Extend the Request type to include file
interface CustomRequest extends Request {
  file?: Express.Multer.File
}

export const addDiningRecommendation = async (req: CustomRequest, res: Response) => {
  try {
    const { restaurantName, location, review, rating, tags, airportId, userId } = req.body

    const airport = await Airport.findById(airportId)
    if (!airport) {
      return res.status(404).json({ message: 'Airport not found' })
    }

    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(tags)
    } catch (err) {
      return res.status(400).json({ message: 'Invalid tags format' })
    }

    let imageUrl = ''
    const createRecommendation = async () => {
      const newRecommendation = new DiningRecommendation({
        restaurantName,
        location,
        review,
        rating,
        tags: parsedTags,
        imageUrl,
        airport: airport._id,
        user: userId
      })

      await newRecommendation.save()
      res.status(201).json(newRecommendation)
    }

    if (req.file) {
      const blob = bucket.file(`${uuidv4()}_${req.file.originalname}`)
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype
      })

      blobStream.on('error', (err: any) => {
        console.error('Blob stream error:', err)
        res.status(500).json({ message: err.message })
      })

      blobStream.on('finish', async () => {
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        await createRecommendation()
      })

      blobStream.end(req.file.buffer)
    } else {
      await createRecommendation()
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const getCrewPicks = async (req: Request, res: Response) => {
  const { airportId } = req.params
  try {
    const crewPicks = await DiningRecommendation.find({ airport: airportId }).populate('user', 'firstName lastName')
    res.status(200).json(crewPicks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crew picks' })
  }
}

export const likeRecommendation = async (req: Request, res: Response) => {
  const { id } = req.params
  const { userId } = req.body

  try {
    const recommendation = await DiningRecommendation.findById(id)
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' })
    }

    const userIndex = recommendation.likedBy.indexOf(userId)
    const userHasLiked = userIndex === -1

    if (userHasLiked) {
      recommendation.likes += 1
      recommendation.likedBy.push(userId)
    } else {
      recommendation.likes -= 1
      recommendation.likedBy.splice(userIndex, 1)
    }

    await recommendation.save()

    const populatedRecommendation = await DiningRecommendation.findById(id).populate('user').lean() // Use lean to get a plain JS object

    if (!populatedRecommendation) {
      return res.status(404).json({ error: 'Failed to retrieve updated recommendation' })
    }

    res.status(200).json({
      ...populatedRecommendation,
      userHasLiked
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update likes' })
  }
}

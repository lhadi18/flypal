import DiningRecommendation from '../models/dining-recommendation-model';
import Airport from '../models/airport-model';
import { Request, Response } from 'express';
import { bucket } from '../services/gcs';
import { v4 as uuidv4 } from 'uuid';

interface CustomRequest extends Request {
  file?: Express.Multer.File;
}

// Add a dining recommendation
export const addDiningRecommendation = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { restaurantName, location, review, rating, tags, airportId, userId } = req.body;

    const airport = await Airport.findById(airportId);
    if (!airport) {
      res.status(404).json({ message: 'Airport not found' });
      return;
    }

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(tags);
    } catch (err) {
      res.status(400).json({ message: 'Invalid tags format' });
      return;
    }

    let imageUrl = '';
    const createRecommendation = async () => {
      const newRecommendation = new DiningRecommendation({
        restaurantName,
        location,
        review,
        rating,
        tags: parsedTags,
        imageUrl,
        airport: airport._id,
        user: userId,
      });

      await newRecommendation.save();
      res.status(201).json(newRecommendation);
    };

    if (req.file) {
      const blob = bucket.file(`dining-recommendation-images/${uuidv4()}_${req.file.originalname}`);
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype,
      });

      blobStream.on('error', (err: any) => {
        console.error('Blob stream error:', err);
        res.status(500).json({ message: err.message });
      });

      blobStream.on('finish', async () => {
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        await createRecommendation();
      });

      blobStream.end(req.file.buffer);
    } else {
      await createRecommendation();
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Add dietary filtering to `getCrewPicks`
export const getCrewPicks = async (req: Request, res: Response) => {
  const { airportId } = req.params
  const { dietaryOption } = req.query

  try {
    const filter: { airport: string; tags?: string } = { airport: airportId }

    if (dietaryOption) {
      filter.tags = dietaryOption as string
    }

    const crewPicks = await DiningRecommendation.find(filter).populate('user', 'firstName lastName')
    res.status(200).json(crewPicks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crew picks' });
  }
};

// Get user recommendations by user ID
export const getUserRecommendations = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const userRecommendations = await DiningRecommendation.find({ user: userId }).populate('user', 'firstName lastName');
    res.status(200).json(userRecommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user recommendations' });
  }
};

// Like or unlike a recommendation
export const likeRecommendation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const recommendation = await DiningRecommendation.findById(id);
    if (!recommendation) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    const userIndex = recommendation.likedBy.indexOf(userId);
    const userHasLiked = userIndex === -1;

    if (userHasLiked) {
      recommendation.likes += 1;
      recommendation.likedBy.push(userId);
    } else {
      recommendation.likes -= 1;
      recommendation.likedBy.splice(userIndex, 1);
    }

    await recommendation.save();

    const populatedRecommendation = await DiningRecommendation.findById(id).populate('user').lean();
    if (!populatedRecommendation) {
      res.status(404).json({ error: 'Failed to retrieve updated recommendation' });
      return;
    }

    res.status(200).json({
      ...populatedRecommendation,
      userHasLiked,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update likes' });
  }
};

// Delete a recommendation
export const deleteRecommendation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const recommendation = await DiningRecommendation.findById(id);
    if (!recommendation) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    // Delete from Google Cloud Storage if there's an image
    if (recommendation.imageUrl) {
      const fileName = recommendation.imageUrl.split('/').pop();
      if (fileName) {
        const file = bucket.file(`dining-recommendation-images/${fileName}`);
        if (file) await file.delete();
      }
    }

    await DiningRecommendation.deleteOne({ _id: id });
    res.status(200).json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recommendation' });
  }
};

// Update a dining recommendation
export const updateDiningRecommendation = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { restaurantName, location, review, rating, tags } = req.body;

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(tags);
    } catch (err) {
      res.status(400).json({ message: 'Invalid tags format' });
      return;
    }

    let updatedFields: any = {
      restaurantName,
      location,
      review,
      rating,
      tags: parsedTags,
    };

    if (req.file) {
      const blob = bucket.file(`dining-recommendation-images/${uuidv4()}_${req.file.originalname}`);
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype,
      });

      blobStream.on('error', (err: any) => {
        console.error('Blob stream error:', err);
        res.status(500).json({ message: err.message });
      });

      blobStream.on('finish', async () => {
        updatedFields.imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        await updateRecommendation();
      });

      blobStream.end(req.file.buffer);
    } else {
      await updateRecommendation();
    }

    async function updateRecommendation() {
      const updatedRecommendation = await DiningRecommendation.findByIdAndUpdate(id, updatedFields, {
        new: true,
      }).populate('user', 'firstName lastName');
      if (!updatedRecommendation) {
        res.status(404).json({ message: 'Recommendation not found' });
        return;
      }
      res.status(200).json(updatedRecommendation);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Key from '../models/keys-model'

// Retrieve a user's public key
  export const getPublicKey = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId; // Correct parameter name
  
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
  
    try {
      // Ensure `userId` is treated as an ObjectId
      const keyData = await Key.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  
      if (!keyData) {
        res.status(404).json({ error: 'Public key not found' });
        return;
      }
  
      res.status(200).json({ publicKey: keyData.publicKey });
    } catch (error) {
      console.error('Error retrieving public key:', error);
  
      if (error instanceof mongoose.Error.CastError) {
        res.status(400).json({ error: 'Invalid User ID format' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
  

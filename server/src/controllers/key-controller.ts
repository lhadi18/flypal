import { Request, Response } from 'express'
import Key from '../models/key-model'

export const storeKey = async (req: Request, res: Response) => {
  const { userId, publicKey, secretKey } = req.body;

  console.log('Request body:', req.body);
  console.log('UserId and PublicKey:', { userId, publicKey, secretKey});

  try {
    // Create a new document in the "keys" collection
    const keyEntry = await Key.create({
      userId,
      publicKey,
      secretKey
    });

    res.status(201).json(keyEntry); // Use 201 Created status for successful creation
  } catch (error) {
    console.error('Error storing public key:', error);
    res.status(500).json({ error: 'Failed to store public key' });
  }
};


export const getKey = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const keyEntry = await Key.findOne({ userId })
    if (!keyEntry) {
      return res.status(404).json({ error: 'Keys not found' })
    }
    res.status(200).json({ publicKey: keyEntry.publicKey, secretKey: keyEntry.secretKey })
  } catch (error) {
    console.error('Error fetching keys:', error)
    res.status(500).json({ error: 'Failed to fetch keys' })
  }
}
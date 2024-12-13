import { Request, Response } from 'express'
import Key from '../models/key-model'

export const storePublicKey = async (req: Request, res: Response) => {
  const { userId, publicKey } = req.body;

  console.log('Request body:', req.body);
  console.log('UserId and PublicKey:', { userId, publicKey });

  try {
    // Create a new document in the "keys" collection
    const keyEntry = await Key.create({
      userId,
      publicKey,
    });

    res.status(201).json(keyEntry); // Use 201 Created status for successful creation
  } catch (error) {
    console.error('Error storing public key:', error);
    res.status(500).json({ error: 'Failed to store public key' });
  }
};


export const getPublicKey = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const keyEntry = await Key.findOne({ userId })
    if (!keyEntry) {
      return res.status(404).json({ error: 'Public key not found' })
    }
    res.status(200).json({ publicKey: keyEntry.publicKey })
  } catch (error) {
    console.error('Error fetching public key:', error)
    res.status(500).json({ error: 'Failed to fetch public key' })
  }
}

export const getEncryptedPrivateKey = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const keyEntry = await Key.findOne({ userId })
    if (!keyEntry?.encryptedPrivateKey) {
      return res.status(404).json({ error: 'Encrypted private key not found' })
    }
    res.status(200).json({ encryptedPrivateKey: keyEntry.encryptedPrivateKey })
  } catch (error) {
    console.error('Error fetching encrypted private key:', error)
    res.status(500).json({ error: 'Failed to fetch encrypted private key' })
  }
}

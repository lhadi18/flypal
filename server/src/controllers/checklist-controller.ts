import { Request, Response, RequestHandler } from 'express';
import mongoose from 'mongoose';
import Checklist from '../models/checklist-model';
import NodeCache from 'node-cache'; // In-memory cache for temporary storage

// Create an in-memory cache instance
const requestCache = new NodeCache({ stdTTL: 20 }); // Cache with a 20-second TTL

// Simple hash function
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to a 32-bit integer
  }
  return hash;
};

export const createChecklist: RequestHandler = async (req: Request, res: Response) => {
  const { userId, title, flightRoute, travelDate, items } = req.body;

  console.log(req.body);
  console.log({ userId, title, flightRoute, travelDate, items });

  if (!userId || !title) {
    res.status(400).json({ message: 'User ID and title are required' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid User ID' });
    return;
  }

  // Generate a simple hash for the request body
  const requestString = JSON.stringify({ userId, title, flightRoute, travelDate, items });
  const requestHash = simpleHash(requestString);

  // Check if the request hash already exists in the cache
  if (requestCache.has(requestHash)) {
    console.log("Debounced")
    res.status(200).json({ message: 'Duplicate request detected. Checklist already created.' });
    return;
  }

  // Store the hash in the cache to track the request
  requestCache.set(requestHash, true);

  try {
    const checklist = new Checklist({
      userId,
      title,
      flightRoute,
      travelDate,
      items,
    });

    await checklist.save();
    res.status(201).json(checklist);
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get all checklists for a user
export const getChecklist: RequestHandler = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid User ID' });
    return;
  }

  try {
    const checklists = await Checklist.find({ userId });

    if (!checklists || checklists.length === 0) {
      res.status(404).json({ message: 'No checklists found for this user' });
      return;
    }

    res.status(200).json(checklists);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a checklist
export const deleteChecklist: RequestHandler = async (req: Request, res: Response) => {
  const { checklistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    res.status(400).json({ error: 'Invalid Checklist ID' });
    return;
  }

  try {
    const checklist = await Checklist.findByIdAndDelete(checklistId);

    if (!checklist) {
      res.status(404).json({ message: 'Checklist not found' });
      return;
    }

    res.status(200).json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a checklist
export const updateChecklist: RequestHandler = async (req: Request, res: Response) => {
  const { checklistId } = req.params;
  const { title, flightRoute, travelDate, items } = req.body;

  if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    res.status(400).json({ message: 'Invalid Checklist ID' });
    return;
  }

  try {
    const checklist = await Checklist.findById(checklistId);

    if (!checklist) {
      res.status(404).json({ message: 'Checklist not found' });
      return;
    }

    checklist.title = title || checklist.title;
    checklist.flightRoute = flightRoute || checklist.flightRoute;
    checklist.travelDate = travelDate || checklist.travelDate;
    checklist.items = items || checklist.items;

    await checklist.save();
    res.status(200).json(checklist);
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

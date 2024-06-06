import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Checklist from '../models/checklist-model';

// Create a new checklist
export const createChecklist = async (req: Request, res: Response) => {
  const { userId, title, flightRoute, travelDate, items } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ message: 'User ID and title are required' });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  try {
    const checklist = new Checklist({
      userId,
      title,
      flightRoute,
      travelDate,
      items
    });

    await checklist.save();

    res.status(201).json(checklist);
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all checklists for a user
export const getChecklists = async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  try {
    const checklists = await Checklist.find({ userId });

    if (!checklists) {
      return res.status(404).json({ message: 'No checklists found for this user' });
    }

    res.status(200).json(checklists);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a checklist
export const deleteChecklist = async (req: Request, res: Response) => {
  const { checklistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    return res.status(400).json({ message: 'Invalid Checklist ID' });
  }

  try {
    const checklist = await Checklist.findByIdAndDelete(checklistId);

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    res.status(200).json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a checklist
export const updateChecklist = async (req: Request, res: Response) => {
  const { checklistId } = req.params;
  const { title, flightRoute, travelDate, items } = req.body;

  if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    return res.status(400).json({ message: 'Invalid Checklist ID' });
  }

  try {
    const checklist = await Checklist.findById(checklistId);

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
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

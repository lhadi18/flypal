import Roster from '../models/roster-model';
import { Request, Response, RequestHandler } from 'express';
import mongoose from 'mongoose';

export const createRosterEntry: RequestHandler = async (req, res) => {
  try {
    const { userId, type, origin, destination, departureTime, arrivalTime, flightNumber, aircraftType, notes } = req.body;

    const newEntry = new Roster({
      userId,
      type,
      origin,
      destination,
      departureTime,
      arrivalTime,
      flightNumber,
      aircraftType,
      notes,
    });

    await newEntry.save();
    res.status(201).json(newEntry);  // No return statement needed
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getRosterEntries: RequestHandler = async (req, res): Promise<void> => {
  const { userId, startDate, endDate } = req.query;

  if (typeof userId !== 'string' || typeof startDate !== 'string' || typeof endDate !== 'string') {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  if (!userId || !startDate || !endDate) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const parsedUserId = new mongoose.Types.ObjectId(userId);
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    const rosters = await Roster.find({
      userId: parsedUserId,
      departureTime: { $gte: parsedStartDate, $lte: parsedEndDate },
    }).populate('origin destination aircraftType');

    res.json(rosters); // No return statement here
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roster entries' });
  }
};

export const updateRosterEntry: RequestHandler = async (req, res): Promise<void> => {
  const { rosterId } = req.params;
  const { userId, type, origin, destination, departureTime, arrivalTime, flightNumber, aircraftType, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(rosterId)) {
    res.status(400).json({ error: 'Invalid roster ID' });
    return;
  }

  try {
    const updatedEntry = await Roster.findByIdAndUpdate(
      rosterId,
      {
        userId,
        type,
        origin,
        destination,
        departureTime,
        arrivalTime,
        flightNumber,
        aircraftType,
        notes,
      },
      { new: true, runValidators: true }
    ).populate('origin destination aircraftType');

    if (!updatedEntry) {
      res.status(404).json({ error: 'Roster entry not found' });
      return;
    }

    res.status(200).json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update roster entry' });
  }
};

export const deleteRosterEntry: RequestHandler = async (req, res): Promise<void> => {
  const { rosterId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(rosterId)) {
    res.status(400).json({ error: 'Invalid roster ID' });
    return;
  }

  try {
    const deletedEntry = await Roster.findByIdAndDelete(rosterId);
    if (!deletedEntry) {
      res.status(404).json({ error: 'Roster entry not found' });
      return;
    }
    res.status(200).json({ message: 'Roster entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete roster entry' });
  }
};

export const getCurrentMonthRoster: RequestHandler = async (req, res): Promise<void> => {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  if (!userId) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const parsedUserId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const rosters = await Roster.find({
      userId: parsedUserId,
      departureTime: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate('origin destination aircraftType');

    res.json(rosters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roster entries for the current month' });
  }
};

export const getNext30DaysRoster: RequestHandler = async (req, res): Promise<void> => {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  if (!userId) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const parsedUserId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOf30Days = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000 - 1);

    const rosters = await Roster.find({
      userId: parsedUserId,
      departureTime: { $gte: startOfToday, $lte: endOf30Days },
    }).populate('origin destination aircraftType');

    const uniqueDestinations = new Map();

    const uniqueRoster = rosters.filter(roster => {
      const destinationKey = roster.destination?._id.toString();
      if (!uniqueDestinations.has(destinationKey)) {
        uniqueDestinations.set(destinationKey, true);
        return true;
      }
      return false;
    });

    res.json(uniqueRoster);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roster entries for the next 30 days' });
  }
};

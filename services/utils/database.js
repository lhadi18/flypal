import aircraftData from '../../assets/database-files/aircrafts.json'
import airportData from '../../assets/database-files/airports.json' // Import JSON directly
import * as SQLite from 'expo-sqlite'

// Initialize the database connection
let db

// Initialize the database asynchronously
export const initializeDatabase = async () => {
  db = await SQLite.openDatabaseAsync('flypal.db')

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS airports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      objectId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      city TEXT,
      country TEXT,
      IATA TEXT,
      ICAO TEXT,
      latitude REAL,
      longitude REAL,
      altitude INTEGER,
      timezone TEXT,
      DST TEXT,
      tz_database TEXT,
      type TEXT,
      source TEXT,
      city_latitude REAL,
      city_longitude REAL
    );
  `)

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS aircrafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      objectId TEXT UNIQUE NOT NULL,
      WingType TEXT,
      model TEXT NOT NULL,
      ACL TEXT,
      updatedAt TEXT,
      manufacturer TEXT,
      IATACode TEXT,
      ICAOCode TEXT,
      Aircraft_Manufacturer TEXT,
      Type TEXT,
      createdAt TEXT
    );
  `)

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS roster_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      type TEXT,
      origin TEXT,
      destination TEXT,
      departureTime TEXT,
      arrivalTime TEXT,
      flightNumber TEXT,
      aircraftType TEXT,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (origin) REFERENCES airports(objectId),
      FOREIGN KEY (destination) REFERENCES airports(objectId),
      FOREIGN KEY (aircraftType) REFERENCES aircrafts(objectId)
    );
  `)

  console.log('Database initialized with tables: roster_entries, airports, aircrafts')
}

// Function to load data into airports table from imported JSON data
export const loadAirportsData = async () => {
  const result = await db.getAllAsync('SELECT COUNT(*) as count FROM airports;')
  const count = result[0]?.count || 0

  if (count > 0) {
    console.log('Airport data already loaded, skipping import.')
    return // Exit if data already exists
  }

  try {
    for (const airport of airportData) {
      await db.runAsync(
        `INSERT INTO airports (objectId, name, city, country, IATA, ICAO, latitude, longitude, altitude, timezone, DST, tz_database, type, source, city_latitude, city_longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          airport._id,
          airport.name,
          airport.city,
          airport.country,
          airport.IATA,
          airport.ICAO,
          airport.latitude,
          airport.longitude,
          airport.altitude,
          airport.timezone,
          airport.DST,
          airport.tz_database,
          airport.type,
          airport.source,
          airport.city_latitude,
          airport.city_longitude
        ]
      )
    }
    console.log('Airport data loaded successfully from JSON file.')
  } catch (error) {
    console.error('Error loading airport data from JSON:', error)
    throw error
  }
}

export const loadAircraftsData = async () => {
  // Check if the aircraft data already exists in the table
  const result = await db.getAllAsync('SELECT COUNT(*) as count FROM aircrafts;')
  const count = result[0]?.count || 0

  if (count > 0) {
    console.log('Aircraft data already loaded, skipping import.')
    return // Exit if data already exists
  }

  try {
    for (const aircraft of aircraftData) {
      await db.runAsync(
        `INSERT INTO aircrafts (objectId, WingType, model, manufacturer, IATACode, ICAOCode)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          aircraft._id, // Use _id as objectId
          aircraft.WingType, // WingType
          aircraft.Model, // Model
          aircraft.Manufacturer, // Manufacturer
          aircraft.IATACode, // IATACode
          aircraft.ICAOCode // ICAOCode
        ]
      )
    }
    console.log('Aircraft data loaded successfully from JSON file.')
  } catch (error) {
    console.error('Error loading aircraft data from JSON:', error)
    throw error
  }
}

// Insert a new roster entry into the database
export const addRosterEntry = async entry => {
  const { userId, type, origin, destination, departureTime, arrivalTime, flightNumber, aircraftType, notes } = entry
  try {
    const result = await db.runAsync(
      `INSERT INTO roster_entries (userId, type, origin, destination, departureTime, arrivalTime, flightNumber, aircraftType, notes, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [userId, type, origin, destination, departureTime, arrivalTime, flightNumber, aircraftType, notes]
    )
    return result.lastInsertRowId
  } catch (error) {
    console.error('Error adding roster entry:', error)
    throw error
  }
}

// Fetch all roster entries from the database
export const getAllRosterEntries = async () => {
  try {
    const rows = await db.getAllAsync('SELECT * FROM roster_entries;')
    return rows
  } catch (error) {
    console.error('Error fetching roster entries:', error)
    throw error
  }
}

// Update a roster entry to mark it as synced
export const markEntryAsSynced = async id => {
  try {
    await db.runAsync(`UPDATE roster_entries SET synced = 1 WHERE id = ?;`, [id])
    console.log(`Entry ${id} marked as synced.`)
  } catch (error) {
    console.error('Error marking entry as synced:', error)
    throw error
  }
}

// Delete a roster entry by ID
export const deleteRosterEntry = async id => {
  try {
    await db.runAsync(`DELETE FROM roster_entries WHERE id = ?;`, [id])
    console.log(`Entry ${id} deleted.`)
  } catch (error) {
    console.error('Error deleting roster entry:', error)
    throw error
  }
}

// Initialize database and load airport data on startup
initializeDatabase()
  .then(async () => {
    await loadAirportsData()
    await loadAircraftsData()
  })
  .catch(error => {
    console.error('Error during database initialization or loading data:', error)
  })

export default db

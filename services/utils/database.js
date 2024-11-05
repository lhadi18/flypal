import aircraftData from '../../assets/database-files/aircrafts.json'
import airportData from '../../assets/database-files/airports.json' // Import JSON directly
import * as SQLite from 'expo-sqlite'
import moment from 'moment-timezone'

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
      id TEXT PRIMARY KEY,
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
      pendingDeletion INTEGER DEFAULT 0,
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
  const {
    userId,
    type,
    origin,
    destination,
    departureTime,
    arrivalTime,
    flightNumber,
    aircraftType,
    notes,
    synced = 0
  } = entry

  const id = entry.id || uuid.v4()
  const createdAt = moment().toISOString()
  const updatedAt = createdAt

  try {
    const result = await db.runAsync(
      `INSERT INTO roster_entries (id, userId, type, origin, destination, departureTime, arrivalTime, flightNumber, aircraftType, notes, synced, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        userId,
        type,
        origin,
        destination,
        departureTime,
        arrivalTime,
        flightNumber,
        aircraftType,
        notes,
        synced,
        createdAt,
        updatedAt
      ]
    )
    return result.lastInsertRowId
  } catch (error) {
    console.error('Error adding roster entry:', error)
    throw error
  }
}

// Fetch all roster entries from the database
// Fetch all roster entries from the database
export const getAllRosterEntries = async () => {
  try {
    const rows = await db.getAllAsync(`
      SELECT roster_entries.*, 
             airports1.objectId as originObjectId, airports1.IATA as originIATA, airports1.ICAO as originICAO, airports1.name as originName, airports1.city as originCity, airports1.country as originCountry, airports1.tz_database as originTz, 
             airports1.latitude as originLatitude, airports1.longitude as originLongitude, 
             airports2.objectId as destinationObjectId, airports2.IATA as destinationIATA, airports2.ICAO as destinationICAO, airports2.name as destinationName, airports2.city as destinationCity, airports2.country as destinationCountry, airports2.tz_database as destinationTz,
             airports2.latitude as destinationLatitude, airports2.longitude as destinationLongitude
      FROM roster_entries
      LEFT JOIN airports AS airports1 ON roster_entries.origin = airports1.objectId
      LEFT JOIN airports AS airports2 ON roster_entries.destination = airports2.objectId
      WHERE pendingDeletion = 0;
    `)

    const data = (rows || []).map(row => ({
      ...row,
      origin: {
        objectId: row.originObjectId,
        IATA: row.originIATA,
        ICAO: row.originICAO,
        name: row.originName,
        city: row.originCity,
        country: row.originCountry,
        tz_database: row.originTz,
        city_latitude: row.originLatitude,
        city_longitude: row.originLongitude
      },
      destination: {
        objectId: row.destinationObjectId,
        IATA: row.destinationIATA,
        ICAO: row.destinationICAO,
        name: row.destinationName,
        city: row.destinationCity,
        country: row.destinationCountry,
        tz_database: row.destinationTz,
        city_latitude: row.destinationLatitude,
        city_longitude: row.destinationLongitude
      }
    }))

    return data
  } catch (error) {
    console.error('Error fetching roster entries from SQLite:', error)
    return []
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

export const updateRosterEntry = async (id, updatedData) => {
  const updatedAt = moment().toISOString() // Set the current timestamp for updatedAt

  try {
    console.log(`Updating roster entry with ID: ${id}`, updatedData)
    await db.runAsync(
      `UPDATE roster_entries 
       SET type = ?, origin = ?, destination = ?, departureTime = ?, arrivalTime = ?, flightNumber = ?, aircraftType = ?, notes = ?, synced = ?, updatedAt = ?
       WHERE id = ?;`,
      [
        updatedData.type,
        updatedData.origin,
        updatedData.destination,
        updatedData.departureTime,
        updatedData.arrivalTime,
        updatedData.flightNumber,
        updatedData.aircraftType,
        updatedData.notes,
        updatedData.synced,
        updatedAt,
        id
      ]
    )
    console.log('Roster entry updated successfully offline')
  } catch (error) {
    console.error('Error updating roster entry offline:', error)
    throw error
  }
}

// Delete a roster entry by ID
// Modify deleteRosterEntry to only handle local SQLite logic
export const deleteRosterEntry = async rosterId => {
  try {
    await db.runAsync('DELETE FROM roster_entries WHERE id = ?', [rosterId])
    console.log(`Roster entry with ID: ${rosterId} deleted offline`)
  } catch (error) {
    console.error('Error deleting roster entry offline:', error)
    throw error
  }
}

// Modify the function to accept a search query parameter
export const getAirportsFromDatabase = async (searchQuery = '') => {
  try {
    const params = []
    let query = 'SELECT * FROM airports WHERE '

    if (searchQuery) {
      const searchTerms = [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
      params.push(...searchTerms)
      query += '(city LIKE ? OR country LIKE ? OR IATA LIKE ? OR ICAO LIKE ?)'
    }

    query += ';'

    const rows = await db.getAllAsync(query, params)

    return rows.map(row => ({
      value: row.objectId,
      label: `(${row.IATA}/${row.ICAO}) - ${row.name}`,
      timezone: row.tz_database,
      city_latitude: row.latitude,
      city_longitude: row.longitude,
      city: row.city,
      country: row.country,
      ICAO: row.ICAO,
      IATA: row.IATA
    }))
  } catch (error) {
    console.error('Error fetching airports from SQLite:', error)
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

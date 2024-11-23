import { getAirportsByIATA } from '../controllers/airport-controller'

interface Duty {
  type?: string
  flightNumber?: string
  standby?: string
  startTime?: string
  endTime?: string
  departureTime?: string
  arrivalTime?: string
  dutyEndTime?: string
  departureAirport?: string | Airport
  arrivalAirport?: string | Airport
  overnight?: string
  reportingTime?: string
}

interface Airport {
  name: string
  city: string
  country: string
  IATA: string
  ICAO: string
  latitude: number
  longitude: number
  altitude: number
  timezone: string
  DST: string
  tz_database: string
  type: string
  source: string
  city_latitude: number
  city_longitude: number
  objectId: string
}

const parseInput = async (lines: string[]): Promise<Duty[]> => {
  const data: Duty[] = []
  let currentDuty: Duty = {}
  let standbyDuty = false

  const invisibleUnicodeRegex = /[\u200B\u200C\u200D\uFEFF]/g // Regex to match invisible unicode characters

  const isTime = (str: string) => /^\d{2}:\d{2}$/.test(str)
  const isFlightNumber = (str: string) => /^D\d{3,4}$/.test(str)
  const isAirportCode = (str: string) => /^[A-Z]{3}$/.test(str.replace('*', ''))

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(invisibleUnicodeRegex, '').trim() // Remove invisible characters and trim whitespace

    const standbyMatch = line.match(/D7S\d/)
    if (standbyMatch) {
      line = standbyMatch[0]
    }

    if (isFlightNumber(line)) {
      if (Object.keys(currentDuty).length > 0) {
        currentDuty.type = currentDuty.standby ? 'STANDBY' : 'FLIGHT'
        data.push(currentDuty)
        currentDuty = {}
      }
      currentDuty.flightNumber = line
    } else if (isTime(line)) {
      if (standbyDuty) {
        if (!currentDuty.startTime) {
          currentDuty.startTime = line
        } else if (!currentDuty.endTime) {
          currentDuty.endTime = line
          currentDuty.type = 'STANDBY'
          data.push(currentDuty)
          currentDuty = {}
          standbyDuty = false
        }
      } else {
        if (!currentDuty.departureTime) {
          currentDuty.departureTime = line
        } else if (!currentDuty.arrivalTime) {
          currentDuty.arrivalTime = line
        } else if (!currentDuty.dutyEndTime) {
          currentDuty.dutyEndTime = line
        }
      }
    } else if (isAirportCode(line.replace('*', ''))) {
      line = line.replace('*', '') // Remove asterisk from airport code before assigning
      if (!currentDuty.departureAirport) {
        currentDuty.departureAirport = line
      } else {
        currentDuty.arrivalAirport = line
      }
    } else if (line === '→' || line === '↓') {
      currentDuty.overnight = line
    } else if (/^D7S\d$/.test(line)) {
      if (Object.keys(currentDuty).length > 0) {
        currentDuty.type = currentDuty.standby ? 'STANDBY' : 'FLIGHT'
        data.push(currentDuty)
        currentDuty = {}
      }
      currentDuty.standby = line
      standbyDuty = true
    }
  }

  if (Object.keys(currentDuty).length > 0) {
    currentDuty.type = currentDuty.standby ? 'STANDBY' : 'FLIGHT'
    data.push(currentDuty)
  }

  for (let duty of data) {
    if (duty.reportingTime) {
      duty.dutyEndTime = duty.arrivalTime
      duty.arrivalTime = duty.departureTime
      duty.departureTime = duty.reportingTime
      delete duty.reportingTime
    }

    if (duty.standby && duty.overnight) {
      if (duty.startTime && duty.endTime && duty.endTime < duty.startTime) {
        const [hours, minutes] = duty.endTime.split(':').map(Number)
        const newEndTime = new Date()
        newEndTime.setHours(hours + 24, minutes)
        duty.endTime = `${newEndTime.getHours().toString().padStart(2, '0')}:${newEndTime.getMinutes().toString().padStart(2, '0')}`
      }
    }
  }

  const uniqueAirports = extractUniqueAirports(data)
  const airports = await getAirportsByIATA(uniqueAirports)

  let formattedAirports: Airport[] = []
  if (airports) {
    formattedAirports = airports.map(airport => {
      const { _id, ...rest } = airport
      return {
        ...rest,
        objectId: _id.toString()
      } as Airport
    })
  }

  data.forEach(duty => {
    if (duty.departureAirport) {
      duty.departureAirport =
        formattedAirports.find(airport => airport.IATA === duty.departureAirport) || duty.departureAirport
    }
    if (duty.arrivalAirport) {
      duty.arrivalAirport =
        formattedAirports.find(airport => airport.IATA === duty.arrivalAirport) || duty.arrivalAirport
    }
  })

  // Filter out incomplete duties
  return data.filter(
    duty =>
      (duty.flightNumber && duty.departureAirport && duty.arrivalAirport && duty.departureTime && duty.arrivalTime) ||
      (duty.standby && duty.startTime && duty.endTime)
  )
}

const extractUniqueAirports = (duties: Duty[]): string[] => {
  const airportSet = new Set<string>()

  duties.forEach(duty => {
    // Ensure the duty has sufficient information to be considered valid
    if (duty.flightNumber && duty.departureTime && duty.arrivalTime) {
      if (typeof duty.departureAirport === 'string') {
        airportSet.add(duty.departureAirport) // Only add strings
      }
      if (typeof duty.arrivalAirport === 'string') {
        airportSet.add(duty.arrivalAirport) // Only add strings
      }
    }
  })

  return Array.from(airportSet)
}

export { parseInput, Duty }

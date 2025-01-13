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

const parseAirAsiaRoster = async (lines: string[]): Promise<{ duties: Duty[]; startDate: string; endDate: string }> => {
  const data: Duty[] = []
  let currentDuty: Duty = {}
  let standbyDuty = false

  const invisibleUnicodeRegex = /[\u200B\u200C\u200D\uFEFF]/g
  const dateRangeRegex = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/

  let startDate = ''
  let endDate = ''

  const isTime = (str: string) => /^A?\d{2}:\d{2}$/.test(str)
  const isFlightNumber = (str: string) => /^D\d{3,4}$/.test(str)
  const isAirportCode = (str: string) => /^[A-Z]{3}$/.test(str.replace('*', ''))

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(invisibleUnicodeRegex, '').trim()

    const dateMatch = line.match(dateRangeRegex)
    if (dateMatch) {
      startDate = dateMatch[1]
      endDate = dateMatch[2]
      continue
    }

    const standbyMatch = line.match(/D7S\d/)
    if (standbyMatch) {
      line = standbyMatch[0]
    }

    if (line == 'TRG' || line == 'CRM') continue

    if (isFlightNumber(line)) {
      if (Object.keys(currentDuty).length > 0) {
        currentDuty.type = currentDuty.standby ? 'STANDBY' : 'FLIGHT_DUTY'
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
      line = line.replace('*', '')
      if (!currentDuty.departureAirport) {
        currentDuty.departureAirport = line
      } else {
        currentDuty.arrivalAirport = line
      }
    } else if (line === '→' || line === '↓') {
      currentDuty.overnight = line
    } else if (/^D7S\d$/.test(line)) {
      if (Object.keys(currentDuty).length > 0) {
        currentDuty.type = currentDuty.standby ? 'STANDBY' : 'FLIGHT_DUTY'
        data.push(currentDuty)
        currentDuty = {}
      }
      currentDuty.standby = line
      standbyDuty = true
    }
  }

  if (Object.keys(currentDuty).length > 0) {
    currentDuty.type = currentDuty.standby ? 'STANDBY' : 'FLIGHT_DUTY'
    data.push(currentDuty)
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
  const filteredDuties = data.filter(
    duty =>
      (duty.flightNumber && duty.departureAirport && duty.arrivalAirport && duty.departureTime && duty.arrivalTime) ||
      (duty.standby && duty.startTime && duty.endTime)
  )

  return { duties: filteredDuties, startDate, endDate }
}

const extractUniqueAirports = (duties: Duty[]): string[] => {
  const airportSet = new Set<string>()

  duties.forEach(duty => {
    if (duty.flightNumber && duty.departureTime && duty.arrivalTime) {
      if (typeof duty.departureAirport === 'string') {
        airportSet.add(duty.departureAirport)
      }
      if (typeof duty.arrivalAirport === 'string') {
        airportSet.add(duty.arrivalAirport)
      }
    }
  })

  return Array.from(airportSet)
}

export { parseAirAsiaRoster, Duty }

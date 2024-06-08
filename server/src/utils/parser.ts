// src/utils/parser.ts

interface Duty {
  type?: string
  flightNumber?: string
  standby?: string
  startTime?: string
  endTime?: string
  departureTime?: string
  arrivalTime?: string
  dutyEndTime?: string
  departureAirport?: string
  arrivalAirport?: string
  overnight?: string
  reportingTime?: string
}

const parseInput = (lines: string[]): Duty[] => {
  const data: Duty[] = []
  let currentDuty: Duty = {}
  let standbyDuty = false
  let restOrOffDuty = false

  const isTime = (str: string) => /^\d{2}:\d{2}$/.test(str)
  const isFlightNumber = (str: string) => /^D\d{3,4}$/.test(str)
  const isAirportCode = (str: string) => /^[A-Z]{3}$/.test(str)
  const isOffRest = (str: string) => /^(OFF|REST|AL)+$/.test(str)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (isOffRest(line)) {
      if (Object.keys(currentDuty).length > 0) {
        data.push(currentDuty)
        currentDuty = {}
      }
      currentDuty.type = line
      restOrOffDuty = true
    } else if (isFlightNumber(line)) {
      if (Object.keys(currentDuty).length > 0) {
        data.push(currentDuty)
        currentDuty = {}
      }
      currentDuty.flightNumber = line
      restOrOffDuty = false
    } else if (isTime(line)) {
      if (standbyDuty) {
        if (!currentDuty.startTime) {
          currentDuty.startTime = line
        } else if (!currentDuty.endTime) {
          currentDuty.endTime = line
          data.push(currentDuty)
          currentDuty = {}
          standbyDuty = false
        }
      } else if (restOrOffDuty) {
        currentDuty.reportingTime = line
        restOrOffDuty = false
      } else {
        if (!currentDuty.departureTime) {
          currentDuty.departureTime = line
        } else if (!currentDuty.arrivalTime) {
          currentDuty.arrivalTime = line
        } else if (!currentDuty.dutyEndTime) {
          currentDuty.dutyEndTime = line
        }
      }
    } else if (isAirportCode(line)) {
      if (!currentDuty.departureAirport) {
        currentDuty.departureAirport = line
      } else {
        currentDuty.arrivalAirport = line
      }
    } else if (line === '→' || line === '↓') {
      currentDuty.overnight = line
    } else if (/^D7S\d$/.test(line)) {
      if (Object.keys(currentDuty).length > 0) {
        data.push(currentDuty)
        currentDuty = {}
      }
      currentDuty.standby = line
      standbyDuty = true
    }
  }

  if (Object.keys(currentDuty).length > 0) {
    data.push(currentDuty)
  }

  // Adjust the labeling of times
  for (let duty of data) {
    if (duty.reportingTime) {
      duty.dutyEndTime = duty.arrivalTime
      duty.arrivalTime = duty.departureTime
      duty.departureTime = duty.reportingTime
      delete duty.reportingTime
    }
  }

  return data
}

export { parseInput, Duty }

import { Duty } from '../utils/parser'

const parseGenericRoster = async (text: string): Promise<Duty[]> => {
  return [{ type: 'UNKNOWN', flightNumber: 'N/A' }]
}

export { parseGenericRoster }

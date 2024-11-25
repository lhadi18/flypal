import { parseAirAsiaRoster } from './airasia-parser'
// import { parseGenericRoster } from './generic-parser'

const parseRoster = async (text: string): Promise<any> => {
  const lines = text.split('\n')

  if (text.includes('AIR ASIA')) {
    return await parseAirAsiaRoster(lines)
  }

  // Additional airline parser
  // return await parseGenericRoster(lines);
}

export { parseRoster }

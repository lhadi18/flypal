import crypto from 'crypto'

export const generateDiningId = (restaurantName: string, location: string): string => {
  return crypto
    .createHash('md5')
    .update(restaurantName + location)
    .digest('hex')
}

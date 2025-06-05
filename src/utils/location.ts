import type { Coordinates, LocationValidation } from '@/types'

// Office coordinates (El Mansoura CIH)
const OFFICE_COORDINATES: Coordinates = {
  latitude: parseFloat(process.env.OFFICE_LATITUDE || '31.0417'),
  longitude: parseFloat(process.env.OFFICE_LONGITUDE || '31.3778')
}

const OFFICE_RADIUS = parseFloat(process.env.OFFICE_RADIUS || '100') // meters

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Validate if coordinates are within office radius
 */
export async function validateLocation(
  latitude: number,
  longitude: number
): Promise<LocationValidation> {
  const distance = calculateDistance(
    latitude,
    longitude,
    OFFICE_COORDINATES.latitude,
    OFFICE_COORDINATES.longitude
  )

  return {
    isValid: distance <= OFFICE_RADIUS,
    distance,
    coordinates: { latitude, longitude }
  }
}

/**
 * Get office coordinates
 */
export function getOfficeCoordinates(): Coordinates {
  return OFFICE_COORDINATES
}

/**
 * Get office radius
 */
export function getOfficeRadius(): number {
  return OFFICE_RADIUS
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(6)}°N, ${coordinates.longitude.toFixed(6)}°E`
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180 &&
    !isNaN(lat) && !isNaN(lon)
  )
}

/**
 * Get distance description
 */
export function getDistanceDescription(distance: number): string {
  if (distance < 10) return 'Very close'
  if (distance < 50) return 'Close'
  if (distance < 100) return 'Near'
  if (distance < 500) return 'Nearby'
  if (distance < 1000) return 'Far'
  return 'Very far'
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const θ = Math.atan2(y, x)
  return ((θ * 180) / Math.PI + 360) % 360 // in degrees
}

/**
 * Get direction description
 */
export function getDirectionDescription(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(bearing / 45) % 8
  return directions[index]
} 
import { LocationData } from './types';

// Mobile-optimized geolocation with fallback
export async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const options = {
      enableHighAccuracy: true, // Try GPS first
      timeout: 30000,          // 30s timeout for mobile GPS (critical fix)
      maximumAge: 0,           // Force fresh position
    };

    const success = (pos: GeolocationPosition) => resolve(pos);

    const error = (err: GeolocationPositionError) => {
      // Enhanced error messages for UI
      switch (err.code) {
        case err.PERMISSION_DENIED:
          reject(new Error('LOCATION_DENIED')); // Specific code for UI
          break;
        case err.TIMEOUT:
          reject(new Error('LOCATION_TIMEOUT'));
          break;
        case err.POSITION_UNAVAILABLE:
          reject(new Error('LOCATION_UNAVAILABLE'));
          break;
        default:
          reject(err);
      }
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<LocationData> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      {
        headers: {
          'User-Agent': 'PanchayatConnect/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }

    const data = await response.json();
    const address = data.address || {};

    // Extract panchayat/village name from various fields
    const panchayat =
      address.village ||
      address.suburb ||
      address.town ||
      address.city_district ||
      address.municipality ||
      address.city ||
      address.county ||
      'Unknown Location';

    // Build full address
    const addressParts = [
      address.road,
      address.neighbourhood,
      address.suburb,
      address.village || address.town || address.city,
      address.state_district,
      address.state,
      address.postcode,
    ].filter(Boolean);

    const fullAddress = addressParts.join(', ');

    // Generate possible panchayat names
    const possiblePanchayats = [
      address.village,
      address.suburb,
      address.town,
      address.city_district,
      address.municipality,
    ].filter(Boolean);

    return {
      lat,
      lng,
      address: fullAddress || data.display_name || 'Address not found',
      panchayat,
      possiblePanchayats: possiblePanchayats.length > 1 ? possiblePanchayats : undefined,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      lat,
      lng,
      address: 'Unable to detect address',
      panchayat: 'Unknown Panchayat',
    };
  }
}

export async function detectLocation(): Promise<LocationData> {
  try {
    const position = await getCurrentLocation();
    const { latitude, longitude } = position.coords;
    return await reverseGeocode(latitude, longitude);
  } catch (error) {
    console.error('Location detection error:', error);
    throw error;
  }
}

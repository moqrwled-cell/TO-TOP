/**
 * src/services/locationService.js
 * Centralized Geolocation Service for نحو الأفضل (To Top).
 * Wraps @capacitor/geolocation with browser navigator fallback, localStorage caching,
 * and canonical Makkah Al-Mukarramah default.
 */

import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Canonical fallback: Holy Kaaba, Makkah Al-Mukarramah
export const DEFAULT_LOCATION = Object.freeze({
  latitude: 21.4225,
  longitude: 39.8262,
  city: 'مكة المكرمة',
  country: 'المملكة العربية السعودية',
  isFallback: true,
  source: 'default-makkah'
});

const STORAGE_KEYS = {
  LAST_LOCATION: 'to_top_last_known_location',
  PERMISSION_STATE: 'to_top_location_permission_state'
};

/**
 * Get canonical default location (Makkah Al-Mukarramah)
 * @returns {{ latitude: number, longitude: number, city: string, country: string, isFallback: boolean, source: string }}
 */
export function getDefaultLocation() {
  return { ...DEFAULT_LOCATION };
}

/**
 * Retrieve cached location from localStorage
 * @returns {Object|null}
 */
export function getLastKnownLocation() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (
      typeof data.latitude === 'number' &&
      Number.isFinite(data.latitude) &&
      typeof data.longitude === 'number' &&
      Number.isFinite(data.longitude)
    ) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || 'موقع محفوظ',
        timestamp: data.timestamp || Date.now(),
        isFallback: false,
        source: 'cached'
      };
    }
  } catch (err) {
    console.warn('[locationService] Failed to read cached location:', err);
  }
  return null;
}

/**
 * Persist valid location to localStorage
 * @param {Object} locationData
 */
export function saveLastKnownLocation(locationData) {
  try {
    if (typeof localStorage === 'undefined') return;
    const payload = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      city: locationData.city || 'موقعي الحالي',
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify(payload));
  } catch (err) {
    console.warn('[locationService] Failed to cache location:', err);
  }
}

/**
 * Check location permission status across native and web
 * @returns {Promise<{ granted: boolean, state: string, canPrompt: boolean }>}
 */
export async function checkLocationPermission() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      const status = await Geolocation.checkPermissions();
      const granted = status.location === 'granted' || status.coarseLocation === 'granted';
      return {
        granted,
        state: status.location || 'prompt',
        canPrompt: status.location !== 'denied'
      };
    }

    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: status.state === 'granted',
        state: status.state,
        canPrompt: status.state !== 'denied'
      };
    }
  } catch (err) {
    console.warn('[locationService] Error checking permissions:', err);
  }

  return { granted: false, state: 'unknown', canPrompt: true };
}

/**
 * Explicitly request location permission across native and web
 * @returns {Promise<{ granted: boolean, state: string }>}
 */
export async function requestLocationPermission() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      const status = await Geolocation.requestPermissions();
      const granted = status.location === 'granted' || status.coarseLocation === 'granted';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PERMISSION_STATE, status.location);
      }
      return { granted, state: status.location };
    }

    // Web fallback trigger
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        resolve({ granted: false, state: 'unsupported' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          saveLastKnownLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          resolve({ granted: true, state: 'granted' });
        },
        (err) => {
          resolve({ granted: false, state: err.code === 1 ? 'denied' : 'error' });
        },
        { timeout: 8000 }
      );
    });
  } catch (err) {
    console.warn('[locationService] Error requesting permissions:', err);
    return { granted: false, state: 'error' };
  }
}

/**
 * Get current device location with 4-tier graceful fallback cascade:
 * Tier 1: Capacitor Native Geolocation
 * Tier 2: Browser Navigator Geolocation
 * Tier 3: Cached localStorage Location
 * Tier 4: Canonical Makkah Default
 *
 * NEVER throws; always resolves with a valid coordinates object.
 *
 * @param {Object} [options={}]
 * @param {number} [options.timeout=8000] - Timeout in milliseconds
 * @param {boolean} [options.enableHighAccuracy=false] - High GPS accuracy flag
 * @returns {Promise<{ latitude: number, longitude: number, isFallback: boolean, source: string, city?: string, accuracy?: number }>}
 */
export async function getCurrentLocation(options = {}) {
  const timeout = options.timeout || 8000;
  const enableHighAccuracy = options.enableHighAccuracy ?? false;

  // Tier 1: Capacitor Native Geolocation
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
          console.warn('[locationService] Native location permission denied.');
          return resolveFallback('permission_denied_native');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout
      });

      if (position?.coords) {
        const result = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isFallback: false,
          source: 'native-gps'
        };
        saveLastKnownLocation(result);
        return result;
      }
    } catch (err) {
      console.warn('[locationService] Native geolocation failed:', err?.message || err);
    }
  }

  // Tier 2: Browser Navigator Geolocation
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const result = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              isFallback: false,
              source: 'browser-gps'
            });
          },
          (err) => reject(err),
          { enableHighAccuracy, timeout, maximumAge: 600000 }
        );
      });

      saveLastKnownLocation(result);
      return result;
    } catch (err) {
      console.warn('[locationService] Browser geolocation failed:', err?.message || err);
    }
  }

  // Tier 3 & 4: Cached or Default Makkah
  return resolveFallback('all_providers_failed');
}

/**
 * Internal resolver for cached or default fallback
 * @param {string} reason
 */
function resolveFallback(reason) {
  const cached = getLastKnownLocation();
  if (cached) {
    return {
      ...cached,
      isFallback: true,
      fallbackReason: reason,
      source: 'cached'
    };
  }

  return {
    ...DEFAULT_LOCATION,
    fallbackReason: reason
  };
}

// Major Islamic & Arab capitals/cities for fallback selection
export const FALLBACK_CITIES = Object.freeze([
  { id: 'makkah', name: 'مكة المكرمة', englishName: 'Makkah', latitude: 21.4225, longitude: 39.8262, country: 'المملكة العربية السعودية' },
  { id: 'madinah', name: 'المدينة المنورة', englishName: 'Madinah', latitude: 24.5247, longitude: 39.5692, country: 'المملكة العربية السعودية' },
  { id: 'riyadh', name: 'الرياض', englishName: 'Riyadh', latitude: 24.7136, longitude: 46.6753, country: 'المملكة العربية السعودية' },
  { id: 'cairo', name: 'القاهرة', englishName: 'Cairo', latitude: 30.0444, longitude: 31.2357, country: 'جمهورية مصر العربية' },
  { id: 'jerusalem', name: 'القدس الشريف', englishName: 'Jerusalem', latitude: 31.7683, longitude: 35.2137, country: 'فلسطين' },
  { id: 'dubai', name: 'دبي', englishName: 'Dubai', latitude: 25.2048, longitude: 55.2708, country: 'الإمارات العربية المتحدة' },
  { id: 'amman', name: 'عمّان', englishName: 'Amman', latitude: 31.9454, longitude: 35.9284, country: 'المملكة الأردنية الهاشمية' },
  { id: 'kuwait', name: 'الكويت', englishName: 'Kuwait City', latitude: 29.3759, longitude: 47.9774, country: 'دولة الكويت' },
  { id: 'doha', name: 'الدوحة', englishName: 'Doha', latitude: 25.2854, longitude: 51.5310, country: 'دولة قطر' },
  { id: 'muscat', name: 'مسقط', englishName: 'Muscat', latitude: 23.5880, longitude: 58.3829, country: 'سلطنة عمان' },
  { id: 'manama', name: 'المنامة', englishName: 'Manama', latitude: 26.2285, longitude: 50.5860, country: 'مملكة البحرين' },
  { id: 'baghdad', name: 'بغداد', englishName: 'Baghdad', latitude: 33.3152, longitude: 44.3661, country: 'جمهورية العراق' },
  { id: 'damascus', name: 'دمشق', englishName: 'Damascus', latitude: 33.5138, longitude: 36.2765, country: 'الجمهورية العربية السورية' },
  { id: 'beirut', name: 'بيروت', englishName: 'Beirut', latitude: 33.8938, longitude: 35.5018, country: 'الجمهورية اللبنانية' },
  { id: 'tripoli', name: 'طرابلس', englishName: 'Tripoli', latitude: 32.8872, longitude: 13.1913, country: 'دولة ليبيا' },
  { id: 'tunis', name: 'تونس', englishName: 'Tunis', latitude: 36.8065, longitude: 10.1815, country: 'الجمهورية التونسية' },
  { id: 'algiers', name: 'الجزائر', englishName: 'Algiers', latitude: 36.7538, longitude: 3.0588, country: 'الجمهورية الجزائرية' },
  { id: 'rabat', name: 'الرباط', englishName: 'Rabat', latitude: 34.0209, longitude: -6.8416, country: 'المملكة المغربية' },
  { id: 'khartoum', name: 'الخرطوم', englishName: 'Khartoum', latitude: 15.5007, longitude: 32.5599, country: 'جمهورية السودان' },
  { id: 'sanaa', name: 'صنعاء', englishName: 'Sanaa', latitude: 15.3694, longitude: 44.1910, country: 'الجمهورية اليمنية' }
]);

/**
 * Manually set active fallback city and persist to cache
 * @param {string|Object} cityInput - City id or city object
 * @returns {Object|null}
 */
export function setManualLocation(cityInput) {
  const city = typeof cityInput === 'string'
    ? FALLBACK_CITIES.find(c => c.id === cityInput || c.name === cityInput)
    : cityInput;

  if (
    !city ||
    typeof city.latitude !== 'number' ||
    !Number.isFinite(city.latitude) ||
    typeof city.longitude !== 'number' ||
    !Number.isFinite(city.longitude)
  ) {
    return null;
  }

  const payload = {
    latitude: city.latitude,
    longitude: city.longitude,
    city: city.name || city.city,
    country: city.country || '',
    isFallback: true,
    source: 'manual-city',
    timestamp: Date.now()
  };

  saveLastKnownLocation(payload);
  return payload;
}


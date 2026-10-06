/**
 * Proposed additions to src/services/locationService.js
 * Adds FALLBACK_CITIES catalog and setManualLocation helper.
 */

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

  if (!city || typeof city.latitude !== 'number' || typeof city.longitude !== 'number') {
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

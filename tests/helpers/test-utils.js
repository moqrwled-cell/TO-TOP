import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '../../');

/**
 * Read text content from a file relative to project root
 */
export function readProjectFile(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Check if a file exists relative to project root
 */
export function fileExists(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  return fs.existsSync(fullPath);
}

/**
 * Parse CSS custom properties (:root and [data-theme=...]) from CSS text
 */
export function parseCssVariables(cssText) {
  const vars = {};
  if (!cssText) return vars;

  const rootRegex = /(?::root|\[data-theme=["']?([a-zA-Z0-9_-]+)["']?\])[^{]*\{([^}]+)\}/g;
  let match;
  while ((match = rootRegex.exec(cssText)) !== null) {
    const scope = match[1] || 'default';
    if (!vars[scope]) vars[scope] = {};

    const decls = match[2].split(';');
    for (const decl of decls) {
      const parts = decl.split(':');
      if (parts.length >= 2) {
        const prop = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        if (prop.startsWith('--')) {
          vars[scope][prop] = val;
        }
      }
    }
  }
  return vars;
}

/**
 * Convert hex or rgb color to RGB object
 */
export function hexToRgb(colorStr) {
  if (!colorStr) return { r: 0, g: 0, b: 0 };
  const str = colorStr.trim().toLowerCase();

  // Handle #hex
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
  }

  // Handle rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return { r: 0, g: 0, b: 0 };
}

/**
 * Calculate relative luminance per WCAG 2.1
 */
export function getLuminance({ r, g, b }) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function calculateContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Mock Capacitor harness for standalone verification
 */
export function createMockCapacitor() {
  const scheduledNotifications = [];
  const cancelledNotifications = [];
  let permissionStatus = { display: 'granted' };
  let locationStatus = { location: 'granted' };
  let mockPosition = {
    coords: {
      latitude: 21.4225,
      longitude: 39.8262,
      accuracy: 10,
    },
  };
  let locationError = null;

  const LocalNotificationsMock = {
    async checkPermissions() {
      return permissionStatus;
    },
    async requestPermissions() {
      return permissionStatus;
    },
    async schedule(options) {
      if (!options || !Array.isArray(options.notifications)) {
        throw new Error('Invalid options for schedule');
      }
      for (const n of options.notifications) {
        scheduledNotifications.push(n);
      }
      return { notifications: options.notifications };
    },
    async cancel(options) {
      if (!options || !Array.isArray(options.notifications)) {
        throw new Error('Invalid options for cancel');
      }
      for (const n of options.notifications) {
        cancelledNotifications.push(n);
      }
      return true;
    },
    async getPending() {
      return { notifications: [...scheduledNotifications] };
    },
  };

  const GeolocationMock = {
    async checkPermissions() {
      return locationStatus;
    },
    async requestPermissions() {
      return locationStatus;
    },
    async getCurrentPosition() {
      if (locationError) {
        throw locationError;
      }
      return mockPosition;
    },
  };

  return {
    LocalNotifications: LocalNotificationsMock,
    Geolocation: GeolocationMock,
    scheduledNotifications,
    cancelledNotifications,
    setPermissionStatus(status) {
      permissionStatus = status;
    },
    setLocationStatus(status) {
      locationStatus = status;
    },
    setLocationError(error) {
      locationError = error;
    },
    setMockPosition(pos) {
      mockPosition = pos;
    },
    reset() {
      scheduledNotifications.length = 0;
      cancelledNotifications.length = 0;
      permissionStatus = { display: 'granted' };
      locationStatus = { location: 'granted' };
      locationError = null;
    },
  };
}

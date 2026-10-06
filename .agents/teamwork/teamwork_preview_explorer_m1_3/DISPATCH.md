## 2026-10-05T20:04:15Z
You are Explorer M1-3 (Location & Offline Prayer Calculation Service).
Your working directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\teamwork_preview_explorer_m1_3
The project root directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل
Read the original request at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project master plan at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md

Your mission:
Design the concrete implementation specification for `src/services/locationService.js` and `src/services/prayerService.js`:
1. `locationService.js`:
   - `@capacitor/geolocation` wrapper with browser `navigator.geolocation` fallback.
   - Comprehensive error handling and permission denial handling.
   - Fallback coordinates (Makkah default: lat 21.4225, lng 39.8262).
2. `prayerService.js`:
   - Offline astronomical prayer calculation engine (clean mathematical implementation or adhan algorithm embedded cleanly so it requires 0 network calls when offline).
   - Sync with online AlAdhan API when online as enhancement.
   - Functions for `calculatePrayerTimes(coords, date)`, `getNextPrayer(prayerTimes)`, and countdown formatting.
Write your full report to `handoff.md` in your working directory and send a message when complete.

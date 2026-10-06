# BRIEFING — 2026-10-05T20:11:30Z

## Mission
Design concrete implementation specification for locationService.js and prayerService.js (offline astronomical prayer engine, Capacitor Geolocation with web fallback, AlAdhan online sync enhancement, next-prayer calculation and countdown).

## 🔒 My Identity
- Archetype: Explorer
- Roles: Location & Offline Prayer Calculation Service Architect
- Working directory: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\teamwork_preview_explorer_m1_3
- Original parent: 8a7e1974-3085-4ddb-9fa8-56a8684507fd
- Milestone: M1 (Native Config & Core Services)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement directly in src/ without orchestrator instruction
- Comprehensive error handling and permission denial handling
- Zero-network offline prayer calculation engine embedded cleanly
- Fallback coordinates (Makkah default: lat 21.4225, lng 39.8262)
- Must follow 5-component handoff report

## Current Parent
- Conversation ID: 8a7e1974-3085-4ddb-9fa8-56a8684507fd
- Updated: 2026-10-05T20:11:30Z

## Investigation State
- **Explored paths**:
  - `package.json` (@capacitor/geolocation ^8.2.3, @capacitor/core ^8.5.2, react 19, vite 8; `adhan` not installed)
  - `src/features/worship/WorshipView.jsx` (current implementation tightly couples to online fetch; breaks offline with error dialog; directly uses raw navigator.geolocation without fallback coordinates or Capacitor plugin)
  - `src/components/Dashboard.jsx` (requires next prayer countdown for M3)
  - Pure JS astronomical calculation engine tested and verified against real AlAdhan API
- **Key findings**:
  - Pure JS astronomical solar math (Julian Date, Sun Declination, Equation of Time, Umm Al-Qura convention) tested in Node.js matches official AlAdhan API down to 0-1 minute across Makkah, Riyadh, Cairo, and Dubai.
  - Zero external npm dependencies are needed for offline calculation; embedding the algorithm guarantees 100% offline uptime and zero bundle bloat.
  - Location resolution requires a 4-tier cascade: Native Capacitor GPS -> Browser Navigator GPS -> Cached last known location -> Default Makkah fallback (`21.4225, 39.8262`).
  - Next prayer countdown calculation handles midnight wrap-around to tomorrow's Fajr and negative delta edge cases.
- **Unexplored areas**:
  - Direct integration into `WorshipView.jsx` and `Dashboard.jsx` scheduled for M2 and M3.

## Key Decisions Made
- Embed pure mathematical calculation directly in `prayerService.js`, eliminating need to `npm install adhan`.
- Implement hybrid online/offline architecture: offline calculation is instant and primary; AlAdhan API syncs in background if online and caches to `localStorage`.
- Implement robust multi-tier fallback in `locationService.js` that never throws an unhandled rejection.

## Artifact Index
- `handoff.md` — Complete 5-component specification report with drop-in code for locationService.js and prayerService.js.

# Technical Analysis: Startup Permissions & Settings Fallbacks Architecture

## 1. Context & Objectives
- **Application**: نحو الأفضل (To Top) — Islamic productivity React 19 / Capacitor 8 SPA.
- **Milestone**: M2 (Feature Integration & Logic Wiring).
- **Core Challenge**: Implement non-blocking startup permissions for Notifications & Geolocation, with robust graceful fallbacks when permissions are denied, dismissed, or running on non-GPS/desktop environments, and provide full user control in `SettingsView.jsx`.

---

## 2. Startup Permissions Flow Analysis (`App.jsx`)

### 2.1 Current Deficiencies Identified
1. **Direct Dependency on Native Plugins**: `App.jsx` was importing directly from `@capacitor/geolocation` and `@capacitor/local-notifications`, bypassing the centralized wrappers (`locationService.js` and `notificationService.js`).
2. **Sequential Blocking Waterfall**: The original flow executed `Geolocation.checkPermissions()` -> `Geolocation.requestPermissions()` -> `LocalNotifications.checkPermissions()` -> `LocalNotifications.requestPermissions()` serially. A slow GPS lock or dismissed dialog delayed notification initialization.
3. **Android Channel Omission**: Native notification channels (`tasks`, `prayers`) were not initialized on startup, leading to potential notification delivery failure on modern Android (API 26+).
4. **No Background Prayer Scheduling**: Prayer times were not computed or scheduled on app launch unless the user explicitly navigated to the `Worship` tab.

### 2.2 Architectural Redesign
```
┌─────────────────────────────────────────────────────────────────┐
│                      App.jsx Startup (Mount)                    │
└─────────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
  initializeNotificationChannels()   Promise.allSettled([
  (Android API 26+ requirement)        requestNotificationPermission(),
                                       getCurrentLocation({ timeout: 6000 })
                                     ])
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       Granted: Active                   Denied / Error / Desktop:
       GPS + System Banners              Makkah / Saved City Fallback
               │                               │
               └───────────────┬───────────────┘
                               ▼
                    getPrayerTimes()
                               ▼
             schedulePrayerNotifications()
             (5 daily prayers pre-scheduled)
```

---

## 3. SettingsView Integration Analysis (`SettingsView.jsx`)

### 3.1 Notification Section Specifications
- **Status Indicator**:
  - `granted`: Green pill `<CheckCircle2 />` ("مفعلة (نشطة)").
  - `denied`: Red pill `<XCircle />` ("معطلة / مرفوضة").
  - `prompt`/`default`: Amber pill `<AlertCircle />` ("غير محددة بعد").
- **Permission Trigger**: Explicit button calling `requestNotificationPermission()` to allow re-prompting or user opt-in.
- **Verification Button**: Calls `testNotification()`, delivering an immediate 1-second test alert (native sound + channel or web notification), with real-time feedback banner.

### 3.2 Location & Fallback City Specifications
- **Status Indicator**: Shows whether active location is GPS-derived or Fallback/Manual.
- **Current Active City**: Displays current city name (e.g., "الرياض" or "مكة المكرمة").
- **GPS Refresh Button**: Triggers `getCurrentLocation({ enableHighAccuracy: true })`.
- **Fallback City Selector**: Dropdown containing 20 curated Arab/Islamic metropolitan centers (`FALLBACK_CITIES`).
  - Selecting a city updates `locationService` cache (`saveLastKnownLocation`).
  - Triggers immediate recalculation of prayer times (`getPrayerTimes({ forceRefresh: true })`).
  - Re-schedules daily prayer notifications (`schedulePrayerNotifications`).

---

## 4. Graceful Fallback Matrix

| Platform / State | Notification Behavior | Location Behavior | User Experience |
|---|---|---|---|
| **Android (GPS + Notif Granted)** | Full native notification banners, sounds (`adhan.wav`, `beep.wav`), exact alarms | High-accuracy GPS coordinates | Real-time local prayer times, automatic task reminders |
| **Android (Notif Denied, GPS Granted)** | Silent local schedule; pending notifications queued; settings indicator shows "معطلة" | High-accuracy GPS coordinates | Accurate prayers displayed; user prompted in settings without modal blocking |
| **Android (GPS Denied, Notif Granted)** | Full native notifications active | Canonical Makkah (or chosen fallback city) | Accurately calculated prayer times based on selected city; zero crashes |
| **Android (Both Denied)** | Internal pending list maintained; zero unhandled rejections | Canonical Makkah fallback | App operates 100% normally; dashboard and worship views remain accessible |
| **Desktop / Web Browser** | Web `Notification` API fallback (if supported and allowed) | Browser Geolocation API -> Makkah fallback | Full interactive preview without native plugin crashes |

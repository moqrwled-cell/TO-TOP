# Dispatch: Explorer M2-2 (WorshipView Prayer & Notification Integration)

## Working Directory
`c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\explorer_m2_2`

## Inputs
- Original Request: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master Project Architecture: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md`
- Worship Component: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\features\worship\WorshipView.jsx`
- Prayer Service: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\services\prayerService.js`
- Notification Service: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\services\notificationService.js`
- Location Service: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\services\locationService.js`

## Mission
1. Investigate `WorshipView.jsx` and how it currently handles prayer times, location state, and notifications.
2. Hook `prayerService` calculation (`calculatePrayerTimes` / `getPrayerTimes`) with fallback location.
3. Hook `notificationService.schedulePrayerNotifications` to schedule local notifications when prayer times are computed/updated, with an optional toggle or auto-schedule.
4. Hook `getNextPrayer` and `formatCountdown` for next prayer countdown.
5. Provide concrete implementation recommendations and write `handoff.md`.


## 2026-10-06T08:42:02Z
You are Explorer M2-2 for Milestone 2 of the "نحو الأفضل" project.
Your assigned working directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\explorer_m2_2
Read the original user request at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project architecture at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md
Read your dispatch brief at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\explorer_m2_2\DISPATCH.md

Investigate:
1. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\features\worship\WorshipView.jsx`
2. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\services\prayerService.js`
3. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\services\notificationService.js`
4. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\services\locationService.js`

Formulate the exact integration design and code changes needed in `WorshipView.jsx` to hook offline/online prayer times, live countdown with `getNextPrayer` and `formatCountdown`, and local notification scheduling with `schedulePrayerNotifications`. Write `handoff.md` and report back.

# Dispatch: Worker M2 (Milestone 2 Implementation)

## Working Directory
`c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\worker_m2`

## Inputs
- Original Request: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master Project Architecture: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md`
- Explorer Reports & Proposed Drop-in Files:
  1. OrganizerView: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\explorer_m2_1\proposed_OrganizerView.jsx` (Report: `explorer_m2_1/handoff.md`)
  2. WorshipView: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\explorer_m2_2\proposed_WorshipView.jsx` (Report: `explorer_m2_2/handoff.md`)
  3. App, SettingsView, locationService: `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\explorer_m2_3\`
     - `proposed_App.jsx`
     - `proposed_SettingsView.jsx`
     - `proposed_locationService.js`
     - (Report: `explorer_m2_3/handoff.md`)

## Target Source Files Owned Exclusively by Worker M2
1. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\features\organizer\OrganizerView.jsx`
2. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\features\worship\WorshipView.jsx`
3. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\App.jsx`
4. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\features\settings\SettingsView.jsx`
5. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\services\locationService.js`

## Task
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, and the 3 Explorer handoff reports.
2. Apply the proposed drop-in implementations into their respective destination source files:
   - Copy/apply `explorer_m2_1/proposed_OrganizerView.jsx` -> `src/features/organizer/OrganizerView.jsx`
   - Copy/apply `explorer_m2_2/proposed_WorshipView.jsx` -> `src/features/worship/WorshipView.jsx`
   - Copy/apply `explorer_m2_3/proposed_App.jsx` -> `src/App.jsx`
   - Copy/apply `explorer_m2_3/proposed_SettingsView.jsx` -> `src/features/settings/SettingsView.jsx`
   - Copy/apply `explorer_m2_3/proposed_locationService.js` -> `src/services/locationService.js`
3. Execute and verify the test commands:
   - `node --test tests/tier3_cross_feature.test.js` (Verify tests 3.1 & 3.2 now pass)
   - `node --test tests/challenger_m1_2.test.js` (Verify 20/20 pass preserved)
   - `node --test tests/adversarial_m1_challenge.test.js` (Verify 13/13 pass preserved)
   - `node tests/run-all.js` (Check progression of passing tests)
   - `npm run build` (Must succeed with zero build errors)
4. Write `handoff.md` and `progress.md` in your working directory `.agents/teamwork/worker_m2/` with exact command outputs and verification details.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-10-06T08:53:55Z
From: 18b66589-c6ee-4ea2-b690-ef7022ba6db2
Tasks:
1. Apply the verified drop-in implementations created by Explorers M2-1, M2-2, and M2-3:
   - `explorer_m2_1/proposed_OrganizerView.jsx` -> `src/features/organizer/OrganizerView.jsx`
   - `explorer_m2_2/proposed_WorshipView.jsx` -> `src/features/worship/WorshipView.jsx`
   - `explorer_m2_3/proposed_App.jsx` -> `src/App.jsx`
   - `explorer_m2_3/proposed_SettingsView.jsx` -> `src/features/settings/SettingsView.jsx`
   - `explorer_m2_3/proposed_locationService.js` -> `src/services/locationService.js`
2. Run build and tests:
   - `node --test tests/tier3_cross_feature.test.js`
   - `node --test tests/challenger_m1_2.test.js`
   - `node --test tests/adversarial_m1_challenge.test.js`
   - `node tests/run-all.js`
   - `npm run build`
3. Document all actions, command outputs, and results in `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\worker_m2\handoff.md`. Send completion message back to orchestrator.

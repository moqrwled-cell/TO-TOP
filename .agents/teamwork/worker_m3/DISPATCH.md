# Dispatch: Worker M3 (Milestone 3 UI/UX Comprehensive Overhaul)

## Working Directory
`c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\worker_m3`

## Target Source Files
1. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\index.css`
2. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\App.jsx`
3. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\components\Dashboard.jsx`
4. `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\src\components\MoreModal.jsx` (create or refine for secondary tabs)

## Objectives & Exact Requirements

### 1. `src/index.css` (Design Tokens & Typography)
- Calibrated Soothing Slate Dark Theme Palette:
  - `--bg-color: #0c0f17;` (strictly NOT `#030303`)
  - `--text-primary: #f1f5f9;` (soft slate white, strictly NOT `#ffffff`)
  - `--text-secondary: #94a3b8;`
  - `--card-bg: #151c2c;`
  - `--card-border: #222e47;`
  - `--accent-color: #3b82f6;`
- Calibrated Light Theme Tokens (ensuring high WCAG AA/AAA contrast ratios):
  - `--bg-color: #f8fafc;`
  - `--text-primary: #0f172a;`
  - `--text-secondary: #475569;`
  - `--card-bg: #ffffff;`
  - `--card-border: #e2e8f0;`
- Typography scaling:
  - `h1`: `font-size: 1.75rem;` (must be <= 2.2rem)
  - `h2`: `font-size: 1.35rem;`
  - `h3`: `font-size: 1.15rem;`
  - Compact, practical paddings and comfortable card spacing ("غير دفش").

### 2. `src/App.jsx` (Ergonomic 5-Tab Mobile Navigation & Layout)
- Replace any 10-item scrolling bottom bar with a sleek 5-tab mobile navigation bar:
  1. الرئيسية (Home / Dashboard) -> `tab: 'dashboard'`
  2. العبادات (Worship) -> `tab: 'worship'`
  3. المنظم (Organizer) -> `tab: 'organizer'`
  4. الإنجاز (Focus & Goals) -> `tab: 'goals'` or `tab: 'pomodoro'`
  5. المزيد (More) -> opens `MoreModal` or secondary drawer with items: خواطر (Thoughts), مكتبة الحكمة (Wisdom), الدعم (Support), الإعدادات (Settings), تسجيل الخروج (Logout).
- Ensure `App.jsx` does NOT have `padding: '3rem'` or `padding: 3rem` (use compact responsive padding, e.g. `1rem` or `1.25rem`).
- Ensure all startup logic and permissions from Milestone 2 remain 100% intact.

### 3. `src/components/Dashboard.jsx` (RTL Logical CSS & Compact Layout)
- Replace any physical `borderLeft: '4px solid ...'` or `border-left: 4px solid ...` with RTL logical property:
  `borderInlineStart: '4px solid ...'` (or `border-inline-start: 4px solid ...`).
- Compact, modern layout ("غير دفش") with sleek metric cards, quick-access prayer countdown pill, and recent tasks.

### 4. Verification
Run:
- `node tests/run-all.js` (ALL 23 tests across Tier 1, 2, 3, 4 MUST PASS!)
- `npm run build` (Must build with 0 errors)
- `npm run lint` (0 errors)

Document all changes and test outputs in `handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-10-06T09:15:23Z
You are Worker M3 for Milestone 3 (UI/UX Comprehensive Overhaul) of the "نحو الأفضل" project.
Your assigned working directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\worker_m3
Read the original user request at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project architecture at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md
Read your dispatch brief at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\worker_m3\DISPATCH.md

Implement Milestone 3:
1. `src/index.css`:
   - Slate dark theme palette: `--bg-color: #0c0f17;` (strictly not `#030303`), `--text-primary: #f1f5f9;` (not `#ffffff`), `--card-bg: #151c2c;`, `--card-border: #222e47;`, `--accent-color: #3b82f6;`.
   - Calibrated light theme with WCAG AA/AAA contrast ratios.
   - Typography scaling: `h1` font size 1.75rem (must be <= 2.2rem).
   - Compact, sleek padding and border radius tokens.
2. `src/App.jsx`:
   - 5-tab mobile bottom navigation bar (Home/Dashboard, Worship, Organizer, Goals/Pomodoro, More).
   - "More" opens a sleek `MoreModal` containing the remaining secondary pages (Thoughts, Wisdom, Support, Settings, Logout).
   - Remove any outer `padding: '3rem'` or `padding: 3rem`.
   - Preserve all M2 startup permission logic and prayer scheduling.
3. `src/components/Dashboard.jsx`:
   - Replace any physical `borderLeft: '4px solid ...'` with RTL logical `borderInlineStart: '4px solid ...'`.
   - Compact, comfortable cards and layout ("غير دفش").
4. Verify by running:
   - `node tests/run-all.js` (ALL 23 tests MUST PASS 23/23!)
   - `npm run build` (Must build with 0 errors)
   - `npm run lint` (0 errors)
5. Document changes and verbatim test results in `c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\worker_m3\handoff.md`.


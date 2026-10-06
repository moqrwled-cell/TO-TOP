## 2026-10-05T20:04:13Z
You are the E2E Test Writer for the "نحو الأفضل" project.
Your working directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\teamwork_preview_test_writer_e2e
The project root directory is: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل
Read the original request at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project master plan at: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل\PROJECT.md

Your mission (E2E Testing Track):
1. Design and author the E2E test infrastructure following the 4-tier methodology (Tier 1: Feature Coverage, Tier 2: Boundary & Corner, Tier 3: Cross-Feature Combinations, Tier 4: Real-World Scenarios).
2. Create `TEST_INFRA.md` at the project root documenting your test philosophy, test architecture, runner, and coverage thresholds.
3. Implement automated test scripts under `tests/` (e.g. node-based integration and verification test scripts) that independently evaluate:
   - UI/UX criteria (CSS tokens, typography scales, 5-tab mobile nav existence, absence of harsh contrast/overflows, RTL logical properties).
   - Local notification scheduling logic (explicit calls to `@capacitor/local-notifications` `schedule` for tasks and prayer times; test verifying that adding a task with time triggers scheduling).
   - Permissions handling logic (requests for Location and Notification with graceful error handling and fallbacks).
4. When the test suite is implemented and ready to run, create `TEST_READY.md` at project root summarizing the runner command and tier counts.
5. Record your progress in `progress.md` in your working directory and deliver `handoff.md` when done. Then send a message back.

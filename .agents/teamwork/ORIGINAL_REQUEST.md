# Original User Request

## 2026-10-05T19:30:21Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: صياغة التعليمات → موافقة المستخدم → توجيه فريق العمل (teamwork_preview)
> Requested team: فريق عمل كامل (Full team)

تطوير وتحسين واجهة وتجربة المستخدم (UI/UX) لتطبيق "نحو الأفضل" ليكون عملياً ومريحاً للعين للاستخدام اليومي، بالإضافة إلى تفعيل نظام الإشعارات المحلية (Local Notifications) للتذكير بالمهام المجدولة وأوقات الصلاة، والتأكد من طلب كافة الصلاحيات اللازمة (الموقع والإشعارات) بشكل صحيح.

Working directory: c:\Users\lenovo\Desktop\شغل محمد\نحو الافضل
Integrity mode: demo

## Requirements

### R1. UI/UX Comprehensive Overhaul
Conduct a comprehensive review and overhaul of the application's user interface. The design must be visually appealing ("غير دفش"), highly practical, comfortable for the eyes, and optimized for daily use.

### R2. Robust Local Notifications
Implement a robust local notification system using Capacitor. The app must successfully schedule notifications to remind the user of their scheduled tasks (in the Organizer) and prayer times.

### R3. Comprehensive Permissions Handling
Ensure all necessary native device permissions—specifically Location (for prayer times) and Notifications—are properly requested, handled, and gracefully fallback if denied.

## Acceptance Criteria

### UI/UX Quality (Agent-as-Judge)
- [ ] An independent UI-review agent (e.g., UI Finish-Gate Reviewer) evaluates the application and confirms the padding, typography, and layouts are sleek, comfortable, and practical for daily use.

### Notification Scheduling (Programmatic / Logic Check)
- [ ] The codebase contains explicit calls to `@capacitor/local-notifications` `schedule` method for both tasks and prayer times.
- [ ] A test script or reviewing agent confirms that adding a task with a time successfully triggers a notification schedule event.

### Permissions Handling (Programmatic / Logic Check)
- [ ] The app successfully requests both Location and Notification permissions on startup or when the respective features are accessed, with proper `catch` blocks for errors.


## 2026-10-05T20:15:55Z

The server experienced a restart and all background tasks were stopped. Please revive, check your current status and artifacts, and resume your work on Milestone 1 implementation and E2E testing from where you left off.


## 2026-10-06T08:31:46Z

Credits have been refilled and the user wants to resume immediately. Please recover from the previous RESOURCE_EXHAUSTED error, resume the succession protocol if needed, and proceed swiftly with Milestone 2 (UI Integration & Logic wiring) to finish the job without taking too long.


## 2026-10-06T09:12:13Z

CRITICAL RECOVERY NOTICE: The server crashed and restarted.
User's credits are low (50% left) and they want us to finish FAST and WITHOUT REPEATING previous work.
DO NOT repeat Milestone 1 or Milestone 2 work. Both were fully coded and verified (M1: Core services, M2: Feature integration).
IMMEDIATELY resume your progress exactly at Milestone 3 (UI/UX Comprehensive Overhaul).
Skip any redundant exploratory tracks for M3 if possible. Go straight to applying the slate dark theme, 5-tab mobile navigation, RTL typography, and practical layout optimizations to the codebase.
Hurry and deliver the UI updates.


## 2026-10-06T09:34:26Z

CRITICAL DIRECTIVE: The user's credits are now at 30% and dropping. Stop any further Verification or Milestone 4 activities immediately. Finalize the task NOW, output the final victory report, and terminate your execution gracefully to save the user's credits. All code is working and tests passed, so you can safely stop.

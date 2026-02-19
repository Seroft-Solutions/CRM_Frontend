# Dashboard Data Flow Analysis

This file explains exactly how `Scheduled Meetings` and `Staff Lead Performance` fetch data and map it into the Dashboard UI.

## 1) Entry Point and Visibility

- Dashboard route: `CRM_Frontend/src/app/(protected)/dashboard/page.tsx:8`
- If user is in `Business Partners` group, app renders `BusinessPartnerDashboard` and **does not** show these two sections: `CRM_Frontend/src/app/(protected)/dashboard/page.tsx:11`
- Otherwise app renders `DashboardOverview` where both sections are implemented: `CRM_Frontend/src/app/(protected)/dashboard/page.tsx:25`

## 2) Scheduled Meetings - Fetch and Mapping

### Frontend state and filters

- Period state: `meetingPeriod` (`DAILY | WEEKLY | MONTHLY | OTHERS`)
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:66`
- Date range builder:
  - `DAILY`: today start -> tomorrow start
  - `WEEKLY`: Monday start -> next Monday start
  - `MONTHLY`: first day of month -> first day of next month
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:73`
- `OTHERS` uses rolling next 7 days from "now"
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:104`

### Query params sent to backend

- Base filter object (`meetingFiltersBase`):
  - `'meetingDateTime.greaterThanOrEqual' = range.start`
  - `'meetingDateTime.lessThan' = range.end`
  - `'meetingStatus.in' = ['SCHEDULED', 'CONFIRMED']`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:111`

- Meetings list query:
  - Hook: `useGetAllMeetings(...)`
  - Adds `sort: ['meetingDateTime,asc']`
  - Adds `size: 20`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:122`

- Meetings count query:
  - Hook: `useCountMeetings(meetingFiltersBase)`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:128`

- "Meetings today" count query:
  - Hook: `useCountMeetings(...)` with DAILY range + same status filter
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:130`

### API hook to REST endpoint mapping

- `useGetAllMeetings` -> `GET /api/meetings`
  - Source: `CRM_Frontend/src/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen.ts:294`
- `useCountMeetings` -> `GET /api/meetings/count`
  - Source: `CRM_Frontend/src/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen.ts:434`
- Filter keys are valid criteria params (`meetingDateTime.greaterThanOrEqual`, `meetingDateTime.lessThan`, `meetingStatus.in`)
  - Source: `CRM_Frontend/src/core/api/generated/spring/schemas/GetAllMeetingsParams.ts:31`
  - Source: `CRM_Frontend/src/core/api/generated/spring/schemas/GetAllMeetingsParams.ts:96`
  - Source: `CRM_Frontend/src/core/api/generated/spring/schemas/CountMeetingsParams.ts:31`
  - Source: `CRM_Frontend/src/core/api/generated/spring/schemas/CountMeetingsParams.ts:96`

### Backend execution path

- `GET /api/meetings` accepts `MeetingCriteria` and pageable
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/meeting/web/rest/MeetingResource.java:151`
- `GET /api/meetings/count` uses same criteria object
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/meeting/web/rest/MeetingResource.java:169`
- Criteria converted to JPA specification in `MeetingQueryService`
  - `meetingDateTime`, `meetingStatus`, relation joins
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/meeting/service/MeetingQueryService.java:83`
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/meeting/service/MeetingQueryService.java:90`
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/meeting/service/MeetingQueryService.java:99`

### UI field mapping (each displayed value)

- Card title: `meeting.title`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:645`
- Organizer text:
  - `meeting.organizer.displayName`
  - else `meeting.organizer.firstName + meeting.organizer.lastName`
  - else `meeting.organizer.email`
  - else `'Unassigned'`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:626`
- Lead no text: `meeting.call.leadNo` else `—`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:631`
  - `leadNo` exists on `CallDTO`
  - Source: `CRM_Frontend/src/core/api/generated/spring/schemas/CallDTO.ts:21`
- Customer text: `meeting.assignedCustomer.customerBusinessName` else `—`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:632`
  - `customerBusinessName` exists on `CustomerDTO`
  - Source: `CRM_Frontend/src/core/api/generated/spring/schemas/CustomerDTO.ts:18`
- Badge text: `meeting.meetingStatus`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:656`
- Date/time text: `new Date(meeting.meetingDateTime).toLocaleDateString()/toLocaleTimeString()`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:625`

## 3) Staff Lead Performance - Fetch and Mapping

### Frontend state and query args

- Period state: `staffPeriod` (`DAILY | WEEKLY | MONTHLY`)
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:64`
- Staff state: `selectedStaff` (`ALL` or staff email)
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:65`
- Query call:
  - `period: staffPeriod`
  - `assignedUser: undefined` when `ALL`, else selected email
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:68`

### Custom hook to endpoint mapping

- Hook file: `CRM_Frontend/src/core/api/call-analytics.ts:36`
- Endpoint: `GET /api/calls/staff-lead-summary`
  - Source: `CRM_Frontend/src/core/api/call-analytics.ts:30`
- Params: `{ period, assignedUser? }`
  - Source: `CRM_Frontend/src/core/api/call-analytics.ts:20`
- React Query key: `['/api/calls/staff-lead-summary', params]`
  - Source: `CRM_Frontend/src/core/api/call-analytics.ts:42`

### Backend execution path

- REST endpoint in call resource:
  - `@GetMapping("/staff-lead-summary")`
  - required query param `period`
  - optional query param `assignedUser`
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/call/web/rest/CallResource.java:193`

- Service computes date range from server local timezone:
  - `DAILY`: start of day -> +1 day
  - `WEEKLY`: Monday start -> +7 days
  - `MONTHLY`: first day of month -> +1 month
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/call/service/CallAnalyticsService.java:29`

- Repository JPQL aggregation:
  - grouped by assigned user email (`assignee.email`)
  - filtered by `c.createdDate >= :start and c.createdDate < :end`
  - optional filter `(:assignedUser is null or assignee.email = :assignedUser)`
  - `total = count(c)`
  - `active = sum(case when c.status = ACTIVE then 1 else 0 end)`
  - `inactive = sum(case when c.status = INACTIVE then 1 else 0 end)`
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/call/repository/CallRepository.java:66`

- Enum values used by aggregation:
  - `ACTIVE`, `INACTIVE` come from call entity `status` enum, not `callStatus` relation
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/call/domain/enumeration/Status.java:6`
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/call/domain/Call.java:85`

### Staff dropdown mapping

- Staff dropdown is built from `useGetAllUserProfiles({ size: 1000 })`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:56`
- Hook maps to `GET /api/user-profiles`
  - Source: `CRM_Frontend/src/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen.ts:294`
- Label logic:
  - `displayName` OR `firstName + lastName` OR `email`
  - Option `value` is always `email`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:305`

### UI mapping for cards and chart

- API response DTO fields: `assignedUser`, `total`, `active`, `inactive`
  - Source: `CRM_Frontend/src/core/api/call-analytics.ts:11`
  - Source: `CRM_Backend/src/main/java/com/crm/cup/features/call/service/dto/CallStaffLeadSummaryDTO.java:12`

- "All Staff" mode:
  - `staffTotals = reduce(sum total/active/inactive across all rows)`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:319`

- Single staff mode:
  - `selectedSummary = find(item.assignedUser === selectedStaff)` else zero object
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:329`

- KPI cards:
  - Total Leads = `selectedSummary.total`
  - Active Leads = `selectedSummary.active`
  - Inactive Leads = `selectedSummary.inactive`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:803`

- Chart data:
  - `ALL` mode: one row per assigned user
  - selected staff mode: one row for selected user
  - `Bar` series read `total`, `active`, `inactive`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:338`
  - Source: `CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx:818`

## 4) Commands to Re-Implement in a New Branch

Use these commands to reproduce the same implementation from current branch `Order-Feature`.

### Frontend commands

```bash
cd /home/abdulrehman/Office_Env/Code/CRM/CRM_Frontend
git switch <base-branch>
git switch -c dashboard-replay-schedule-staff

# Bring exact dashboard implementation from Order-Feature
git checkout Order-Feature -- \
  "src/app/(protected)/dashboard/page.tsx" \
  "src/features/dashboard/components/DashboardOverview.tsx" \
  "src/core/api/call-analytics.ts"

git add "src/app/(protected)/dashboard/page.tsx" "src/features/dashboard/components/DashboardOverview.tsx" "src/core/api/call-analytics.ts"
git commit -m "Replay dashboard scheduled meetings + staff lead performance implementation"
```

### Backend commands (staff summary API)

```bash
cd /home/abdulrehman/Office_Env/Code/CRM/CRM_Backend
git switch <base-branch>
git switch -c dashboard-replay-staff-summary-api

# Bring exact staff summary backend from Order-Feature
git checkout Order-Feature -- \
  "src/main/java/com/crm/cup/features/call/web/rest/CallResource.java" \
  "src/main/java/com/crm/cup/features/call/service/CallAnalyticsService.java" \
  "src/main/java/com/crm/cup/features/call/service/CallSummaryPeriod.java" \
  "src/main/java/com/crm/cup/features/call/repository/CallRepository.java" \
  "src/main/java/com/crm/cup/features/call/service/dto/CallStaffLeadSummaryDTO.java"

git add \
  "src/main/java/com/crm/cup/features/call/web/rest/CallResource.java" \
  "src/main/java/com/crm/cup/features/call/service/CallAnalyticsService.java" \
  "src/main/java/com/crm/cup/features/call/service/CallSummaryPeriod.java" \
  "src/main/java/com/crm/cup/features/call/repository/CallRepository.java" \
  "src/main/java/com/crm/cup/features/call/service/dto/CallStaffLeadSummaryDTO.java"
git commit -m "Replay staff lead summary API used by dashboard"
```

### Quick trace commands (to inspect again later)

```bash
cd /home/abdulrehman/Office_Env/Code/CRM
rg -n "Scheduled Meetings|Staff Lead Performance|useGetStaffLeadSummary|meetingFiltersBase|staffTotals" CRM_Frontend/src/features/dashboard/components/DashboardOverview.tsx
rg -n "staff-lead-summary|CallSummaryPeriod|findStaffLeadSummary" CRM_Backend/src/main/java/com/crm/cup/features/call
rg -n "getAllMeetings|countMeetings|/api/meetings" CRM_Frontend/src/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen.ts
```

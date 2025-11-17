# Playwright test structure

## Current setup
- Config: `playwright.config.ts:1` uses `testDir: ./tests`, `baseURL` `http://localhost:3000`, spins up `npm run dev` automatically, and runs against all browsers/devices.
- Public entry: `/` renders `HomePage` with the “Start Brewing” CTA that triggers Keycloak sign-in (`src/features/home/components/HeroSection.tsx`).
- Protected area: `src/app/(protected)/layout.tsx` redirects unauthenticated users to `/`, wraps pages with the sidebar, breadcrumbs, and session manager.
- Navigation map (drives coverage): `src/components/sidebar/sidebar-items.ts` defines Dashboard, Partner Dashboard, Leads (Call tracking/import/history), My Staff (org users + invites), Business Partners (invite/manage), Masters (call type/status/priority/source/channel/areas), Customers, and Product Management (categories/sub-categories/products).

## Proposed directory layout
```
tests/
  README.md             # this file
  fixtures/             # auth + data helpers (storageState, seeds, cleanup)
  page-objects/         # reusable UI models (sidebar, tables, forms, modals)
  utils/                # test ids, random data, API clients
  e2e/
    smoke/              # landing + basic navigation checks
    auth-onboarding/    # Keycloak login, org selection, session expiry flows
    dashboard/          # widgets + filters + empty states
    calls/              # create/edit lead, filters, activity timeline
    calls-import/       # upload, validation errors, result summary download
    customers/          # table filters, create/edit customer
    products/           # CRUD + images + relationships + drafts
    partners/           # invite + manage partner records (list/detail)
    user-management/    # organization users + invite users + role checks
    masters/            # call types/statuses/priorities/sources/channel/areas
```

## Suite outlines (what to automate)
- **Smoke**: landing page renders hero + CTA; sidebar appears after login; breadcrumbs update when navigating.
- **Auth + onboarding**: login via Keycloak; org selection persists in `localStorage`/cookies; unauthorized redirects to `/`; idle timeout/session refresh modals behave correctly.
- **Dashboard**: load widget data, handle empty states, filters persist on refresh, links drill into details.
- **Leads (calls)**: create lead (required fields, validation); edit lead; table filters/search/sorting; role-based visibility; track lead detail view.
- **Leads import**: upload CSV/XLSX with valid + invalid rows; show failed-row table with messages; pagination + download results; retry import.
- **Customers**: list filters (createdBy for partners), create/edit customer, view detail and ensure data matches API.
- **Products**: category/sub-category CRUD; product wizard (step navigation, validation, drafts); image upload/reorder/delete; relationship fields in `enhanced-product-relationship-field.tsx` handle single/multi select.
- **Business partners**: invite flow; manage list; partner detail page for `[id]`; permission guard for partner-only dashboard.
- **User management**: org users list filters; invite user form; role/authority guard using `use-rbac` and `PermissionGuard`.
- **Masters**: call type/status/priority/source/channel/areas CRUD; ensure dependent dropdowns update (e.g., sub call type vs call type).
- **Resilience**: reload preserves filters and org; 401/403 surfaces unauthorized page; background refresh resets tokens gracefully.

## Recommended helpers
- **Global auth fixture**: use Playwright `storageState` in `global-setup.ts` to sign in once with `E2E_USERNAME/E2E_PASSWORD` (Keycloak). Store selected org id/name in `localStorage` to skip the org picker.
- **Page objects**: sidebar navigator (drives routes from `sidebar-items.ts`), table model (sorting, filter chips, pagination), form helper (fill inputs by label, handles `react-hook-form` validation states).
- **Data setup**: small seed helpers that call backend APIs for entities (products, calls, customers) so tests stay deterministic; clean up created records after each suite.

## Running
- `npm run test:e2e` – headless all projects.
- `npm run test:e2e:headed` – local debugging.
- `npm run test:e2e:ui` – visual runner; enable/disable suites quickly.

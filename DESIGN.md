# CRM Cup - Design Language

## Overview

A dense, polished design system for all order pages (Purchase Orders & Sale Orders). Optimized for business users who need maximum information density with clear visual hierarchy. Applied consistently across detail views, list tables, forms, fulfillment, and approval pages.

---

## Page Types & Layouts

### 1. List Page (Floating Card Table)

```
┌──────────────────────────────────────────────────────┐
│ [icon] Sale Orders    From [date] To [date] [+New]   │  ← dark header
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ [All] [Created] [Approved] [Shipped] ...         │ │  ← status tabs
│ │ All Orders · 73 orders          [Search] [Clear] │ │  ← search bar
│ │ ORDER  STATUS  TOTAL  SHIPPING  CUSTOMER  ...    │ │  ← table header
│ │ Filter Filter  Filter  Filter   Filter    ...    │ │  ← filter row
│ │ 2 #12555 Created ₹55,000 Not set TechSol...     │ │  ← data rows
│ │ 3 #12554 Created ₹55,000 Not set Brainx  ...     │ │     (scrollable)
│ │ ...                                               │ │
│ │ Rows: 11 (auto) Showing 1-11 of 73  [< 1 of 7 >]│ │  ← pagination
│ └──────────────────────────────────────────────────┘ │
│                    bg-slate-100                       │  ← visible gap
└──────────────────────────────────────────────────────┘
```

- **Outer wrapper**: `h-[100vh] overflow-hidden bg-slate-100`
- **Table card**: `rounded-xl border-slate-300 shadow-lg h-full` inside `p-3` container
- **Table area**: `flex-1 overflow-auto` (scrollable rows)
- **Pagination**: `mt-auto` (sticks to bottom)
- **Auto page size**: `Math.floor((viewport - 440) / 40)` rows
- **Server-side pagination**: uses `totalCount` for page calculation

### 2. Detail View (Dashboard)

```
┌──────────────────────────────────────────────────────┐
│ [PO] #12101  Purchase Order    [Back][Approve][Edit]  │  ← dark header
├──────────┬──────────┬──────────┬─────────┬───────────┤
│ ₹600     │ Pending  │ Pending  │ Aimen   │ ◉ Status  │  ← 5-col metrics
├──────────┴──────────┴──────────┴─────────┼───────────┤
│ ITEMS [2]               [History][Fulfill]│ CREDITOR  │
│ # PRODUCT  SKU  VARIANT  WH  QTY PRC TOT │ Name/Ph/Em│
│ 1 new_serum ...  ...     Org  1  ₹300 ₹300│ HISTORY   │
│ 2 new_serum ...  ...     Org  1  ₹300 ₹300│ 1 Updated │
│          (scrollable, flex-1)             │ 2 Created │
│                                           ├───────────┤
│                                           │ ADDRESSES │
├── 2 items · Base ₹600 ────── ₹600.00 ────┤ Ship/Bill │
│              (dark total bar)             │ Audit...  │
└───────────────────────────────────────────┴───────────┘
```

- **Fixed height**: `h-[calc(100vh-12px)]`
- **2-column body**: `grid-cols-[1fr_280px]`
- **Items table**: `flex-1 overflow-auto`, 9 columns
- **Total bar**: `bg-slate-900 text-white mt-auto`
- **Right sidebar**: contact → history (flex-1 scrollable) → addresses → audit

### 3. Form Pages (Edit / New)

- Dark header with CSS breadcrumb injection only
- Form content wrapper preserved: `relative left-1/2 w-[calc(100vw-var(--sidebar-width))]`
- No layout changes to form components themselves

### 4. Action Pages (Approve / Fulfillment / History)

- Dark header: `bg-slate-900 text-white px-4 py-2`
- Ghost navigation buttons
- Content below header unchanged

---

## Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `bg-sidebar-accent` | Amber | Primary accent, CTA buttons, icons |
| `text-sidebar-accent-foreground` | Dark on amber | Text on accent bg |
| `bg-slate-900` | Near black | Headers, total bars |
| `bg-slate-100` | Light gray | Page background behind cards |
| `bg-slate-50` | Off white | Table headers, section headers |
| `bg-white` | White | Card/table body surfaces |
| `border-slate-300` | Medium gray | Section boundaries (sharp) |
| `border-slate-200` | Light gray | Row separators (subtle) |
| `text-slate-800` | Dark | Primary data text |
| `text-slate-500` | Muted | Table headers, labels |
| `text-slate-400` | Lighter | Metric labels, timestamps |

### Semantic Accents (metric icons only)

| Metric | Color |
|--------|-------|
| Total | `bg-sidebar-accent` |
| Payment | `bg-emerald-500` |
| Shipping | `bg-sky-500` |
| Contact | `bg-violet-500` |

### Typography Scale

| Element | Size | Weight | Color | Extra |
|---------|------|--------|-------|-------|
| Page title | 14px (`text-sm`) | Bold | white | — |
| Section labels | 10-11px | Bold | slate-400/500 | `uppercase tracking-wider` |
| Table headers | 11px | Bold | slate-500 | `uppercase tracking-wider` |
| Product name | 13px | Semibold | slate-800 | — |
| Cell data | 12px | Normal | slate-500/600 | — |
| Total amount | 13px | Bold | slate-800 | — |
| Grand total | 16px | Black (900) | white | — |
| Metric value | 14px (`text-sm`) | Bold | slate-800 | — |
| Metric label | 10px | Semibold | slate-400 | `uppercase tracking-widest` |
| Buttons | 11px | Semibold | varies | — |
| Badges | 11px | Semibold | varies | — |

### Spacing

| Element | Padding |
|---------|---------|
| Table rows | `py-1.5` |
| Table headers | `py-2` |
| Sidebar sections | `px-3 py-2.5` |
| Metric cells | `px-3 py-2.5` |
| Page header | `px-4 py-2` |
| Card container | `p-3` (creates floating gap) |
| Table inner sections | `px-4 py-2` / `px-4 py-3` |

### Borders

- **Sharp** (`slate-300`): section boundaries, table card, metric dividers
- **Subtle** (`slate-200`): table rows, history entries, inner dividers
- **Dividers**: `divide-x divide-slate-200` between metric columns

---

## Component Patterns

### Dark Header

```jsx
<div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white">
  <div className="flex items-center gap-2.5 mr-auto">
    <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
      <Icon className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
    </div>
    <span className="text-sm font-bold">Page Title</span>
  </div>
  <div className="flex items-center gap-1.5">
    {/* Ghost buttons: h-7 px-2.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 */}
    {/* Accent button: bg-sidebar-accent text-sidebar-accent-foreground */}
  </div>
</div>
```

### Status Badge (Pill)

```jsx
// Read-only
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusClassName}`}>
  {status}
</span>

// Dropdown
<SelectTrigger className={`h-7 rounded-full text-[11px] font-semibold ${statusClassName}`}>

// Status theme map
const statusColors = {
  Created: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20',
  // ... etc
};
```

### Row Number Badge

```jsx
<span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[9px] font-bold text-white">
  {index + 1}
</span>
```

### Metric Card

```jsx
<div className="flex items-start gap-2.5 px-3 py-2.5">
  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accentColor}`}>
    <Icon className="h-4 w-4 text-white" />
  </div>
  <div className="min-w-0 flex-1">
    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Label</div>
    <div className="text-sm font-bold text-slate-800 truncate">Value</div>
    <div className="text-[10px] text-slate-400 truncate">Sub-info</div>
  </div>
</div>
```

### Action Buttons (Inline, Colorful)

Replaces the old three-dot dropdown menu. Each action has a distinct color for quick visual identification.

```jsx
<div className="flex items-center justify-end gap-1">
  <Button className="h-6 px-2 text-[10px] bg-sky-500 hover:bg-sky-600 text-white rounded">View</Button>
  <Button className="h-6 px-2 text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white rounded">Approve</Button>
  <Button className="h-6 px-2 text-[10px] bg-violet-500 hover:bg-violet-600 text-white rounded">Start Packing</Button>
  <Button className="h-6 px-2 text-[10px] bg-slate-600 hover:bg-slate-700 text-white rounded">Edit</Button>
</div>
```

| Action | Color | Visibility |
|--------|-------|------------|
| View | `bg-sky-500` (blue) | Always |
| Approve | `bg-emerald-500` (green) | Only Created/PartiallyApproved |
| Start Packing | `bg-violet-500` (purple) | Always |
| Edit | `bg-slate-600` (dark gray) | Always |

### Conditional Column Visibility

When a specific status tab is selected (not "All"), redundant columns are hidden:

```js
const showAllColumns = statusFilter === 'All';
```

| Column | "All" tab | Status tab |
|--------|-----------|------------|
| Order | Visible | Visible |
| Status | Visible | **Hidden** |
| Total | Visible | Visible |
| Qty | Visible | Visible |
| Shipping | Visible | **Hidden** |
| Customer/Creditor | Visible | **Hidden** |
| Assignee | Visible | **Hidden** |
| Payment | Visible | **Hidden** |
| Created At | Visible | Visible |
| Actions | Visible | Visible |

Column widths: Order `w-40`, Total `w-32`, Qty `w-20`, Created At `w-32`, others auto-size.
No "Updated At" column (removed).

### Qty Column (Total Item Quantity)

Fetched from order details API per page load:
- PO: `useGetAllPurchaseOrderDetails({ 'purchaseOrderId.in': orderIds, size: 9999 })`
- SO: `useGetAllOrderDetails({ 'orderId.in': orderIds, size: 9999 })`

Sums `quantity` per order. Displayed as pill badge:
```jsx
<span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded bg-slate-100 text-[12px] font-bold text-slate-700 px-1.5">
  {order.totalItemQuantity}
</span>
```

### Auto Page Size

```js
const [pageSize, setPageSize] = useState(() => {
  if (typeof window === 'undefined') return 10;
  const rowHeight = 40;
  const overhead = 440; // header + tabs + search + filters + pagination + padding
  const available = Math.floor((window.innerHeight - overhead) / rowHeight);
  return Math.max(5, Math.min(available, 100));
});
```

- Dropdown includes auto-calculated value with `(auto)` label
- Uses exact count, not snapped to presets

### CSS Injection (Page-Level Layout Override)

```jsx
<style dangerouslySetInnerHTML={{ __html: `
  header:has(nav) { display: none !important; }
  .flex.flex-1.min-w-0.flex-col { overflow: hidden !important; padding: 0 !important; gap: 0 !important; }
  .container.mx-auto { max-width: 100% !important; padding: 0 !important; height: 100% !important; }
  div.flex.min-h-screen:has(.order-list-page) { min-height: 0 !important; height: 100% !important; }
  main:has(.order-list-page) { overflow: hidden !important; min-height: 0 !important; }
`}} />
```

### Floating Card Table

```jsx
<div className="order-list-page flex flex-col h-[100vh] overflow-hidden bg-slate-100">
  {/* CSS injection */}
  {/* Dark header (shrink-0) */}
  <div className="flex-1 overflow-hidden p-3">
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg h-full">
      {/* Tabs → Search → Table (flex-1 overflow-auto) → Pagination (mt-auto) */}
    </div>
  </div>
</div>
```

### Table Cell Overrides

```jsx
// Applied on table container for global cell styling
<div className="table-container flex-1 overflow-auto [&_td]:py-1.5 [&_td]:text-[12px]">
```

### Print Button (Third-Party Override)

```jsx
<div className="[&_button]:bg-transparent [&_button]:border-slate-600 [&_button]:text-slate-300 [&_button]:hover:bg-slate-800 [&_button]:hover:text-white [&_button]:h-7 [&_button]:px-2.5 [&_button]:text-[11px]">
  <InvoicePrintButton order={orderData} orderType="purchase" />
</div>
```

---

## Differences: Purchase Order vs Sale Order

| Aspect | Purchase Order (PO) | Sale Order (SO) |
|--------|---------------------|-----------------|
| Header badge | "PO" + `ShoppingCart` | "SO" + `ShoppingBag` |
| Contact label | "Creditor Details" | "Customer Details" |
| Contact source | `sundryCreditor` | `customer` |
| Discount | N/A | Discount code + amount |
| Quantity calc | Remaining + delivered | Ordered + backorder + delivered |
| Extra toolbar | — | "Back to Manager" button |
| Status set | Created, Approved, PartiallyApproved, Recived, Unpacked, Pending, Cancel | Created, Processing, Approved, Partially Approved, Picked, Packed, Shipped, Delivered, Cancelled, Pending |
| Fulfillment API | `useGetPurchaseOrderFulfillmentGenerations` | `useGetOrderFulfillmentGenerations` |
| Pagination source | Server `totalCount` | Server `totalCount` |

---

## File Coverage

### Pages Updated

| Page | PO | SO |
|------|----|----|
| Detail view (`[id]/page.tsx`) | ✅ | ✅ |
| List (`page.tsx`) | ✅ | ✅ |
| Drafts (`drafts/page.tsx`) | ✅ | ✅ |
| History (`history/page.tsx`) | ✅ | ✅ |
| Edit (`[id]/edit/page.tsx`) | ✅ | ✅ |
| New (`new/page.tsx`) | ✅ | ✅ |
| Edit & Approve (`[id]/edit-approve/page.tsx`) | ✅ | ✅ |
| Fulfillment (`[id]/fulfillment/page.tsx`) | ✅ | ✅ |
| Fulfillment History (`[id]/fulfillment/history/page.tsx`) | ✅ | ✅ |
| Fulfillment Detail (`[id]/fulfillment/history/[generationId]/page.tsx`) | ✅ | ✅ |
| Back to Manager | — | ✅ |

### Components Updated

| Component | PO | SO |
|-----------|----|----|
| `order-detail.tsx` | ✅ | ✅ |
| `order-detail-container.tsx` | ✅ | ✅ |
| `order-table.tsx` | ✅ | ✅ |
| `order-history-table.tsx` | ✅ | ✅ |
| `order-fulfillment-history-table.tsx` | ✅ | ✅ |
| `orders-page.tsx` | ✅ | ✅ |
| `back-to-manager-table.tsx` | — | ✅ |

---

## Principles

1. **Single screen** — all info visible without page scroll; tables scroll internally
2. **Sharp boundaries** — `slate-300` borders between every section
3. **Dense but readable** — 11-13px fonts, `py-1.5` rows, no wasted space
4. **Consistent accent** — sidebar amber theme throughout, no rainbow colors
5. **Information hierarchy** — metrics at top, data in center, context in sidebar
6. **Floating cards** — `rounded-xl shadow-lg` on `bg-slate-100` background
7. **Auto-adaptive** — page size auto-calculated from viewport height
8. **Server pagination** — `totalCount` from API for correct page numbers
9. **Edge-to-edge** — CSS injection overrides parent layout padding/scroll
10. **Dark headers** — `bg-slate-900` with compact ghost buttons on every page

# CRM Cup - Order Detail Design Language

## Overview

A dense, single-screen dashboard layout for viewing order details (Purchase Orders & Sale Orders). Designed for business users who need all information visible without scrolling.

## Layout Structure

```
+----------------------------------------------------------+
| DARK HEADER (slate-900)        [Back] [Approve] [Edit]    |
+----------+-----------+-----------+-----------+------------+
| METRIC 1 | METRIC 2  | METRIC 3  | METRIC 4  |  STATUS   |
| Total    | Payment   | Shipping  | Contact   |  Badge    |
+----------+-----------+-----------+-----------+-----+------+
| ITEMS TOOLBAR              [Manager] [History] [Fulfill]  |
+-------------------------------------------+--+-----------+
| # | PRODUCT | SKU | VARIANT | WH | Q | P | T | TOTAL    | CONTACT   |
|---|---------|-----|---------|----|----|---|---|----------|  DETAILS  |
| 1 | ...     | ... | ...     | .. |  1 | . | . | ...     |-----------|
| 2 | ...     | ... | ...     | .. |  3 | . | . | ...     |  HISTORY  |
| . | (scrollable list fills remaining space)              |  (scroll) |
| . |                                                      |-----------|
+---------- TOTAL BAR (slate-900) --------  GRAND TOTAL ---| ADDRESSES |
|  N items . Base . Disc . Tax . Ship      AMOUNT          |  Ship/Bill|
+----------------------------------------------------------+-----------+
```

## Design Tokens

### Colors
- **Primary accent**: `bg-sidebar-accent` / `text-sidebar-accent-foreground` (amber, inherited from sidebar theme)
- **Dark surfaces**: `bg-slate-900` (header, total bar)
- **Light surfaces**: `bg-white` (cards, table), `bg-slate-50` (section headers)
- **Background**: `bg-slate-100` (page background behind content)
- **Borders**: `border-slate-300` (section boundaries), `border-slate-200` (row separators)
- **Semantic accents** (metric strip icons only):
  - Total: `bg-sidebar-accent`
  - Payment: `bg-emerald-500`
  - Shipping: `bg-sky-500`
  - Contact: `bg-violet-500`

### Typography Scale
| Element          | Size     | Weight    | Color        |
|------------------|----------|-----------|--------------|
| Section labels   | 10-11px  | Bold      | slate-400/500|
| Table headers    | 11px     | Bold      | slate-500    |
| Product name     | 13px     | Semibold  | slate-800    |
| Cell data        | 12px     | Normal    | slate-500/600|
| Total amount     | 13px     | Bold      | slate-800    |
| Grand total      | 16px     | Black     | white        |
| Metric value     | 14px     | Bold      | slate-800    |
| Metric label     | 10px     | Semibold  | slate-400    |

### Spacing
- Row padding: `py-1.5`
- Table header padding: `py-2`
- Section padding: `px-3 py-2.5`
- Metric strip: `px-3 py-2.5`
- Gaps between sections: 0 (border-separated, no gaps)

### Borders
- **Sharp, visible** (`slate-300`) between all major sections
- **Subtle** (`slate-200`) between table rows and history entries
- **Dividers** (`divide-x divide-slate-200`) between metric columns

## Component Patterns

### Dark Header
- `bg-slate-900 text-white`
- Order type badge: colored rounded-md square with 2-letter code (PO/SO)
- Ghost buttons for navigation, accent button for primary action
- Print button: CSS override wrapper for third-party component

### Metric Strip
- 5-column grid with dividers
- Each metric: 32px colored icon pill + label/value/sub stack
- Status column: pulsing dot + rounded-full pill badge

### Items Table
- 9 columns: #, Product, SKU, Variant, Warehouse, Qty, Price, Tax, Total
- `flex-1 overflow-auto` for scrollable content
- Numbered badge: `h-5 w-5 rounded bg-slate-800 text-white`
- Quantity: pill badge with `bg-slate-100`
- Hover: `hover:bg-sidebar-accent/5`

### Total Bar
- Pinned at bottom: `mt-auto`
- Dark: `bg-slate-900 text-white`
- Left: item count + breakdown summary (11px, slate-300)
- Right: grand total (16px, font-black)

### Right Sidebar (280px)
- **Contact section**: Icon + text rows (User/Phone/Mail icons in violet)
- **History section**: `flex-1 overflow-y-auto`, timeline with numbered circles
  - Latest entry: `bg-sidebar-accent`, rest: `bg-slate-300`
  - Connector lines: `w-px bg-slate-200`
- **Addresses section**: Ship To / Bill To with compact address format
- **Audit footer**: `bg-slate-50`, 10px text

### Status Badge System
Each order status maps to a theme with:
- `pill`: background + text + ring classes for the pill container
- `dot`: background class for the pulsing indicator

### Edge-to-Edge Layout
- CSS injection hides breadcrumb header: `header:has(nav) { display: none !important; }`
- Negative margin `-m-4` negates parent padding
- Container max-width overridden to 100%
- Fixed height: `h-[calc(100vh-12px)]`

## Differences: Purchase Order vs Sale Order

| Aspect         | Purchase Order (PO)    | Sale Order (SO)        |
|----------------|------------------------|------------------------|
| Header badge   | "PO" indigo            | "SO" amber             |
| Contact label  | "Creditor Details"     | "Customer Details"     |
| Contact source | `sundryCreditor`       | `customer`             |
| Discount       | N/A                    | Discount code + amount |
| Quantity calc   | Remaining + delivered  | Ordered + backorder + delivered |
| Extra toolbar  | —                      | "Back to Manager" button |
| Status set     | Created, Approved, etc | Created, Processing, Picked, Packed, Shipped, etc |
| Fulfillment API| `useGetPurchaseOrderFulfillmentGenerations` | `useGetOrderFulfillmentGenerations` |

## File Structure

```
orders/
  [id]/page.tsx              # Page wrapper with header slot
  components/
    order-detail-container.tsx  # Data fetching + loading states
    order-detail.tsx            # Full dashboard UI

purchase-orders/
  [id]/page.tsx
  components/
    order-detail-container.tsx
    order-detail.tsx
```

## Principles

1. **Single screen** — all info visible without scroll (items table scrolls internally)
2. **Sharp boundaries** — `slate-300` borders between every section
3. **Dense but readable** — 11-13px fonts, `py-1.5` rows, no wasted space
4. **Consistent accent** — sidebar amber theme throughout, no rainbow
5. **Information hierarchy** — metrics at top, details in table, context in sidebar

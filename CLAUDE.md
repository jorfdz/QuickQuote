# CLAUDE.md — QuikQuote Project Guidelines

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **State Management:** Zustand (with localStorage persistence)
- **Styling:** Tailwind CSS (mobile-first)
- **Routing:** React Router DOM
- **Icons:** Lucide React (exclusively)
- **Deployment:** Vercel

---

## UI Rules

### Icons

All icons **must** come from [lucide-react](https://lucide.dev). No other icon libraries are allowed.

### Responsive Design

Follow a **mobile-first** approach. Start with the mobile layout and use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to scale up.

### Field Help Text

Every form field **must** include a help text tooltip using the `Tip` component (defined in `src/pages/Materials/index.tsx`). The `Tip` renders an `<Info>` icon next to the label that shows a tooltip on hover.

**Pattern:**
```tsx
<label>
  <Tip label="Field Name" tip="Explanation of what this field does and how it affects behavior." />
</label>
```

> The `Tip` component should be extracted to `src/components/ui/index.tsx` so it can be shared across all pages.

### Modal Dialogs

Use the `Modal` component from `src/components/ui/index.tsx`. Available sizes:

| Size Prop | Tailwind Class   | Use Case                                      |
|-----------|------------------|-----------------------------------------------|
| `"sm"`    | `max-w-md`       | Simple confirmations, single-field prompts     |
| `"md"`    | `max-w-lg`       | Small forms (2–4 fields), alerts with details  |
| `"lg"`    | `max-w-2xl`      | Standard forms, edit dialogs                   |
| `"xl"`    | `max-w-3xl`      | Larger forms                                   |
| `"2xl"`   | `max-w-5xl`      | Complex forms, multi-section editors           |
| `"4xl"`   | `max-w-4xl`      | Wide editors                                   |
| `"half"`  | `max-w-[50vw]`   | Half-width panels                              |
| `"full"`  | `max-w-[80vw]`   | Full-width views, previews, data-heavy content |

All modals keep a `max-h-[90vh]` constraint with scrollable body content. The `Modal` component also accepts an optional `className` prop that is applied to the outer container div.

**Tabbed dialogs:** When a modal contains tabs, the dialog **must** maintain a fixed, consistent size regardless of which tab is active. Never allow the modal to grow or shrink when the user switches between tabs.

**The correct way to lock a tabbed modal's height** is to pass `className="h-[90vh]"` directly to the `Modal` component. This forces the container to a fixed height so the `flex-1 overflow-y-auto` body fills the remaining space consistently across all tabs. Do **not** use `min-h` on content inside the modal body — that approach does not work because content lives inside an `overflow-y-auto` element whose height is determined by its flex parent, not its children.

```tsx
<Modal ... size="4xl" className="h-[90vh]">
  {/* tab bar */}
  {/* tab content — will scroll within the fixed-height body */}
  {/* footer buttons */}
</Modal>
```

### Lists & Tables

Every list/table view **must** include all of the following:

1. **Pagination** — displayed at both the **top** and **bottom** of the list so users can navigate from either position. Include page size options (e.g. 25, 50, 100).
2. **Multi-select** — checkboxes on each row plus a "select all" checkbox in the header. When items are selected, show a bulk action bar.
3. **Record counter** — always display the total count and the currently visible range (e.g. "Showing 1–25 of 142 orders").

---

## Project Structure

```
src/
├── components/
│   ├── ui/          # Shared, reusable UI primitives (Modal, Tip, Table, Checkbox, etc.)
│   ├── layout/      # Layout shell, Header, Sidebar
│   └── pricing/     # Pricing-specific components
├── pages/           # One folder per feature/route (e.g. Orders/, Quotes/)
├── store/           # Zustand stores
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Pure utility/helper functions
├── data/            # Mock data, seed data, static datasets
└── assets/          # Images, icons, static files
```

---

## Change History (Audit Trail)

Every edit/add screen for a **record type** (materials, equipment, finishing, labor, brokered, products, etc.) **must** include a **Change History** tab that automatically tracks all field-level changes. This is a non-negotiable audit requirement.

### Rules

1. **Automatic tracking** — Every create, update, and delete action must record a `ChangeRecord` with the user who made the change (`userId`, `userName`), a timestamp, the action type (`created` | `updated` | `deleted`), and the list of field-level diffs.
2. **Field-level diffs** — On update, compare every field (except `id`, `createdAt`, and binary data like `imageUrl`) against the previous value. Only record fields that actually changed. For arrays, use order-independent comparison.
3. **History is immutable** — Users must **not** be able to delete or clear change history. Never expose a "Clear history" button. History is permanent.
4. **Stored in the entity's Zustand store** — Add a `<entity>ChangeHistory: ChangeRecord[]` array to the relevant store and persist it. Add a `get<Entity>History(id)` helper that returns records sorted newest-first.
5. **User attribution** — Every record must include the current user's `id` and `name`, obtained from the app store via `useStore.getState().currentUser`.
6. **UI placement** — The Change History tab appears as the **last tab** in the edit modal. It is only shown when editing an existing record (not when adding new). It displays a timeline with:
   - Color-coded action icons (green = created, blue = updated, red = deleted)
   - User name and timestamp on each entry
   - A table of changed fields with three fixed-width columns: **Field** (30%), **Previous Value** (35%), **New Value** (35%) using `table-fixed` layout
   - Human-readable field labels and resolved names for ID references (e.g. category IDs → category names)
7. **Badge count** — The Change History tab button shows a count badge with the number of history entries.

### Reference implementation

See `src/pages/Materials/index.tsx` (Change History tab) and `src/store/pricingStore.ts` (material change tracking with `materialChangeHistory`, `getMaterialHistory`) for the canonical pattern to follow when adding change history to other entity types.

### Types (defined in `src/types/pricing.ts`)

```ts
interface MaterialFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: string | number | boolean | string[] | null;
  newValue: string | number | boolean | string[] | null;
}

interface MaterialChangeRecord {
  id: string;
  materialId: string;
  materialName: string;
  action: 'created' | 'updated' | 'deleted';
  changes: MaterialFieldChange[];
  userId: string;
  userName: string;
  timestamp: string;
}
```

When implementing for a new entity, create analogous interfaces (e.g. `EquipmentChangeRecord`, `FinishingChangeRecord`) following this same shape.

---

## Conventions

- Use **functional components** only.
- Use **named exports** for components.
- Keep components focused — if a component exceeds ~300 lines, consider splitting it.
- Prefer `interface` for object shapes; use `type` for unions and intersections.
- Avoid `any` — use `unknown` and narrow types when needed.

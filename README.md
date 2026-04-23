# BlueShelf AI

BlueShelf AI is a polished inventory experience for household stock management. It combines fast inventory CRUD, image-based product detection, recipe inspiration, and a more consumer-friendly interface built with Next.js, Supabase, and OpenAI.

## Overview

- Track products with name, category, quantity, image, and movement history
- Add items manually or enhance entries with AI image analysis
- Edit products with a lightweight update flow and optional image replacement
- Adjust stock directly from the card grid with inline feedback
- Review recent inventory activity and lightweight operational signals
- Generate recipe ideas from current inventory
- Start quickly with demo seed data included in `supabase/schema.sql`

## Product Highlights

### Inventory experience

- Create, edit, and delete products
- Increment or decrement quantity directly from each card
- Low-stock and recently-updated visual badges
- Per-card loading states while quantity or delete mutations are running
- Confirmation dialog before delete

### AI-assisted image flow

- Upload a product photo or capture one from the camera
- Run AI analysis as an optional enhancement, not a separate competing flow
- Review a before/after comparison for suggested name and category
- Apply the full AI result, only the suggested name, only the suggested category, or keep current values

### Recipe assistant

- Generate recipe suggestions from the products currently in stock
- Surface recipe ideas in a side panel when the inventory is ready

## Tech Stack

- Next.js 14 App Router
- React 18
- Material UI
- Supabase Postgres
- Supabase Storage
- OpenAI API
- ESLint

## Project Structure

- [app/page.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/page.js): main dashboard and product shell
- [app/api/inventory/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/inventory/route.js): inventory read and create endpoint
- [app/api/inventory/[normalizedName]/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/inventory/[normalizedName]/route.js): update, quantity, and delete endpoint
- [app/api/vision/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/vision/route.js): image analysis endpoint
- [app/api/recipes/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/recipes/route.js): recipe generation endpoint
- [components/AddItemModal.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/components/AddItemModal.js): create/edit modal with AI-assisted image flow
- [components/InventoryCard.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/components/InventoryCard.js): inventory card UI and inline actions
- [hooks/useInventory.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/hooks/useInventory.js): inventory state, mutations, delete confirmation state, and feedback timing
- [lib/server/inventory-store.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/lib/server/inventory-store.js): server-side persistence layer for items, movements, and image uploads
- [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql): database schema, storage bucket creation, and demo seed

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/AzulRK22/inventory.git
cd inventory
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create [.env.local](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/.env.local) with:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=inventory-images
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

Notes:

- `SUPABASE_URL` must be the project URL only, without `/rest/v1/`
- `SUPABASE_SERVICE_ROLE_KEY` must be the real `service_role` key, not the `anon` key
- Keep the Supabase service role key server-side only

### 4. Prepare Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql).
4. Confirm these resources exist:
   - `inventory_items`
   - `inventory_movements`
   - `inventory-images`

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Seed Data

The included SQL seed creates:

- demo pantry and household items
- demo movement history
- the public `inventory-images` bucket

If you want to reset the demo, clear the tables in Supabase and rerun the SQL script.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current UX Direction

The app now includes:

- a unified add flow instead of competing manual vs AI branches
- a lighter edit flow
- safer delete interactions
- richer AI comparison and application controls
- improved card hierarchy and mutation feedback
- stronger visual contrast in the modal and more subdued recipe presentation when inactive

## Known Constraints

- AI-powered vision and recipe generation depend on available OpenAI quota
- The app currently uses a server-side Supabase service role key, so it is designed around trusted server execution
- Build may show non-blocking warnings related to `Browserslist` updates or Node’s `punycode` deprecation

## Suggested Next Improvements

- Add undo support after delete in addition to confirmation
- Add optimistic quantity updates for even snappier card interactions
- Add test coverage for inventory mutations and AI application flows
- Refine copy and accessibility states for keyboard and screen-reader navigation
- Consider a richer empty-state experience and onboarding hints for first-time users

## Contact

- Portfolio: https://www.azulrk.com
- GitHub: https://github.com/AzulRK22

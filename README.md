# BlueShelf AI

BlueShelf AI is a smart inventory app built with Next.js, Supabase, and OpenAI. It helps you track household products, manage stock levels, organize categories, analyze product images, and generate recipe ideas from what is already on the shelf.

## Features

- Smart inventory management with quantities, categories, and recent movement history
- Supabase Postgres persistence for products and Supabase Storage for images
- AI-assisted image analysis for suggested product names and categories
- Recipe suggestions generated from the products currently in inventory
- Included demo seed data so the app looks populated right after setup

## Tech Stack

- Next.js App Router
- React
- Material UI
- Supabase Postgres
- Supabase Storage
- OpenAI API
- ESLint

## Demo Seed

The SQL file [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql) includes:

- table creation
- the `inventory-images` public storage bucket
- demo inventory rows
- demo movement history

Run that SQL in a fresh Supabase project and BlueShelf AI is ready to showcase from the first launch.

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

### 3. Create environment variables

Add the following values to [.env.local](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/.env.local):

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=inventory-images
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

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

## Main Flows

### Inventory

- Create products with name, category, and image
- Edit product details
- Increase or decrease stock
- Delete products cleanly

### Image Analysis

- Upload a photo or capture one with the camera
- Analyze the image to suggest a product name and category

### Recipes

- Generate recipe ideas using what is currently available in inventory

## Project Structure

- [app/page.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/page.js) main dashboard UI
- [app/api/inventory/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/inventory/route.js) inventory list and create endpoint
- [app/api/inventory/[normalizedName]/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/inventory/[normalizedName]/route.js) item update, quantity, and delete endpoint
- [app/api/vision/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/vision/route.js) image analysis endpoint
- [app/api/recipes/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/recipes/route.js) recipe generation endpoint
- [lib/server/supabase.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/lib/server/supabase.js) server-side Supabase client
- [lib/server/inventory-store.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/lib/server/inventory-store.js) persistence layer
- [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql) schema and demo seed

## Notes

- Vision and recipes depend on available OpenAI quota.
- Keep the Supabase `service_role` key only on the server in `.env.local`.
- To reset the demo, clear the Supabase tables and run the SQL again.

## Contact

- Portfolio: https://www.azulrk.com
- GitHub: https://github.com/AzulRK22

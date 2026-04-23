# Azul's Shop

Azul's Shop is an AI-assisted inventory manager built with Next.js, React, and Material UI. It helps users track products with images, adjust quantities, search inventory, detect products from photos, and generate recipe suggestions from current stock.

## Features

- Inventory management with quantity controls and product images
- Smart image upload from local files or camera capture
- Automatic product detection through a secure OpenAI server route
- Recipe suggestions generated through a secure OpenAI server route
- Search and form validation for empty names, duplicates, and invalid images

## Preview

### Main Screen
![Preview 1](images/1.png)

### Add Item Modal
![Preview 2](images/2.png)

## Tech Stack

- Next.js App Router
- React
- Material UI
- Supabase Postgres + Storage
- OpenAI API
- ESLint

## Installation

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

Create a `.env.local` file in the project root:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=inventory-images
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

Luego crea el esquema de Supabase ejecutando el SQL de [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql). Ese archivo crea las tablas `inventory_items`, `inventory_movements` y el bucket público `inventory-images`.

### 4. Run the development server

```bash
npm run dev
```

Open the app at `http://localhost:3000`.

## Usage

- Search items with the top search bar
- Add products from the modal with upload, camera, or auto-detection
- Increase or decrease quantities from each inventory card
- Generate recipe suggestions with the lightbulb button

## Project Structure

- `app/page.js`: Main inventory UI and client interactions
- `app/api/vision/route.js`: Secure server route for image detection with OpenAI
- `app/api/recipes/route.js`: Secure server route for OpenAI recipe suggestions
- `app/api/inventory/...`: Server routes para CRUD del inventario
- `lib/server/supabase.js`: Cliente server-side para Supabase
- `lib/server/inventory-store.js`: Capa de persistencia y movimientos
- `supabase/schema.sql`: Esquema inicial para la base y el bucket
- `public/`: Static assets

## Contributions

Contributions are welcome through issues and pull requests.

## Contact

- Portfolio: https://www.azulrk.com
- GitHub: https://github.com/AzulRK22

# BlueShelf AI

BlueShelf AI es una app de inventario inteligente construida con Next.js, Supabase y OpenAI. Sirve para registrar productos, ajustar cantidades, organizar categorías, analizar imágenes de artículos y generar ideas de recetas con lo que ya tienes disponible.

## Qué Hace

- Gestiona inventario con cantidades, categorías e historial de movimientos.
- Guarda productos en Supabase Postgres y usa Supabase Storage para imágenes.
- Analiza fotos de productos desde la app para sugerir nombre y categoría.
- Genera recetas contextuales a partir del inventario actual.
- Incluye mock data para poblar una demo rápida desde el esquema SQL.

## Stack

- Next.js App Router
- React
- Material UI
- Supabase Postgres
- Supabase Storage
- OpenAI API
- ESLint

## Demo Data

El archivo [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql) ya incluye:

- creación de tablas
- creación del bucket `inventory-images`
- inserción de productos demo
- inserción de movimientos demo

Si ejecutas ese SQL en un proyecto nuevo de Supabase, BlueShelf AI queda con datos listos para mostrar la experiencia desde el primer arranque.

## Configuración

### 1. Clonar el proyecto

```bash
git clone https://github.com/AzulRK22/inventory.git
cd inventory
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear variables de entorno

En [.env.local](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/.env.local) agrega:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=inventory-images
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

### 4. Preparar Supabase

1. Crea un proyecto en Supabase.
2. Abre el SQL Editor.
3. Ejecuta [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql).
4. Verifica que existan:
   - `inventory_items`
   - `inventory_movements`
   - bucket `inventory-images`

### 5. Levantar la app

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Flujo Principal

### Inventario

- Crear productos con nombre, categoría e imagen.
- Editar información del producto.
- Incrementar o disminuir stock.
- Eliminar productos.

### Detección de Imagen

- Subir una foto o capturar desde cámara.
- Analizar la imagen para sugerir nombre y categoría.

### Recetas

- Generar propuestas de recetas usando los productos actuales del inventario.

## Estructura Relevante

- [app/page.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/page.js) UI principal
- [app/api/inventory/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/inventory/route.js) inventario base de lectura/alta
- [app/api/inventory/[normalizedName]/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/inventory/[normalizedName]/route.js) actualización y eliminación
- [app/api/vision/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/vision/route.js) detección por imagen
- [app/api/recipes/route.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/app/api/recipes/route.js) recetas con OpenAI
- [lib/server/supabase.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/lib/server/supabase.js) cliente server-side de Supabase
- [lib/server/inventory-store.js](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/lib/server/inventory-store.js) lógica de persistencia
- [supabase/schema.sql](/Users/azulramirezkuri/Documents/GitHub/inventory_tracker/supabase/schema.sql) esquema y mock data

## Notas

- La visión y las recetas dependen de cuota disponible en OpenAI.
- Para entorno local, la `service role key` de Supabase debe vivir solo en `.env.local`.
- Si quieres reiniciar la demo, puedes limpiar tablas en Supabase y volver a correr el SQL.

## Contacto

- Portfolio: https://www.azulrk.com
- GitHub: https://github.com/AzulRK22

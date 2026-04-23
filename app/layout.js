import "./globals.css";

export const metadata = {
  title: "BlueShelf AI",
  description: "Inventario inteligente con Supabase, visión asistida y recetas generadas con IA.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

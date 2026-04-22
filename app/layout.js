import "./globals.css";

export const metadata = {
  title: "Azul's Shop",
  description: "Gestiona tu inventario de despensa y productos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

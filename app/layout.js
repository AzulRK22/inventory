import "./globals.css";

export const metadata = {
  title: "BlueShelf AI",
  description: "Smart inventory management with Supabase, AI-assisted image analysis, and recipe suggestions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

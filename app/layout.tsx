import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAQ USO — Recolección de preguntas frecuentes",
  description: "Formulario para que el personal de USO registre las preguntas frecuentes de su área.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}

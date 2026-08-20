import type { Metadata } from "next";
import { Poppins, Barlow_Condensed, Cabin } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
});

// Tipografías para la tarjeta Pokémon: Barlow Condensed (condensada, bold)
// imita la Gill Sans Condensed Bold real de los nombres/HP/daño de una carta
// TCG, y Cabin (humanista, cálida) imita la Gill Sans Regular del cuerpo de
// texto. Poppins (geométrica, redondeada) se ve demasiado suave/genérica para
// esos elementos, por eso la tarjeta usa estas dos en vez del resto del sitio.
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
});
const cabin = Cabin({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cabin",
});

export const metadata: Metadata = {
  title: "FAQ USO: Recolección de preguntas frecuentes",
  description: "Formulario para que el personal de USO registre las preguntas frecuentes de su área.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${poppins.variable} ${barlowCondensed.variable} ${cabin.variable}`}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}

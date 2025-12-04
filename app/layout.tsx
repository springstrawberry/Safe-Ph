import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import { Footer } from "./components/footer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Safe PH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="antialiased font-sans">
        {children}
        <Footer />
      </body>
    </html>
  );
}

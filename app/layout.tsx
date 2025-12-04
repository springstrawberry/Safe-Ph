import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import { Footer } from "./components/footer";
import { DisasterAssistant } from "./components/disaster-assistant";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Safe PH - Philippines Disaster Monitoring & Earthquake Tracker",
    template: "%s | Safe PH"
  },
  description: "Real-time earthquake monitoring and disaster tracking system for the Philippines. Track seismic activities, view earthquake history, and stay informed about natural disasters in the Philippines. Powered by USGS data.",
  keywords: [
    "Philippines earthquake",
    "PH disaster alerts",
    "earthquake tracker Philippines",
    "disaster monitoring Philippines",
    "seismic activity Philippines",
    "Philippine earthquake map",
    "USGS Philippines",
    "natural disaster Philippines",
    "earthquake alert Philippines",
    "Safe PH",
    "earthquake tracker PH",
    "Philippine disaster warning",
    "earthquake history Philippines",
    "real-time earthquake Philippines"
  ],
  authors: [{ name: "Denise Valerie" }],
  creator: "Denise Valerie",
  publisher: "Safe PH",
  metadataBase: new URL('https://safe-ph.vercel.app'),
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://safe-ph.vercel.app",
    title: "Safe PH - Philippines Disaster Monitoring & Earthquake Tracker",
    description: "Real-time earthquake monitoring and disaster tracking for the Philippines. Stay informed about seismic activities with live USGS data.",
    siteName: "Safe PH",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Safe PH - Philippines Disaster Monitoring System"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Safe PH - Philippines Disaster Monitoring",
    description: "Real-time earthquake monitoring and disaster tracking for the Philippines",
    creator: "@DeniseValerie",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you get them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'technology',
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
        <DisasterAssistant />
      </body>
    </html>
  );
}

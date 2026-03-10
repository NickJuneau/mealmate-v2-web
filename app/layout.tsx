import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/header";
import QueryProvider from "./providers/QueryProvider";
import AuthProvider from "./providers/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mealmate-usc.com"),
  title: {
    default: "MealMate",
    template: "%s | MealMate",
  },
  description:
    "Track meal swipes from Gmail receipts with a clean weekly dashboard, history, and secure account controls.",
  applicationName: "MealMate",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MealMate | Meal Swipe Tracker",
    description:
      "Track meal swipes from Gmail receipts with a clean weekly dashboard and history.",
    url: "https://www.mealmate-usc.com",
    siteName: "MealMate",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "MealMate",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryProvider>
            <Header />
            <div>{children}</div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

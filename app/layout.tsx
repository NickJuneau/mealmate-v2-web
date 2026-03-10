import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/header";
import QueryProvider from "./providers/QueryProvider";
import AuthProvider from "./providers/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mealmate-usc.com"),
  title: {
    default: "MealMate | Meal Swipe Tracker",
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
  icons: {
    icon: "/favicon-16.svg",
    shortcut: "/favicon-16.svg",
    apple: "/favicon-16.svg",
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

import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/header";
import QueryProvider from "./providers/QueryProvider";
import AuthProvider from "./providers/AuthProvider";

export const metadata: Metadata = {
  title: "MealMate",
  description: "Created by Nick Juneau",
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

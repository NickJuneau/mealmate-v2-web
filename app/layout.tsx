import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/header";

export const metadata: Metadata = {
  title: "Meal Mate v2",
  description: "Created by Nick Juneau",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}

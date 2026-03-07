import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/header";
import QueryProvider from "./providers/QueryProvider";
import AuthProvider from "./providers/AuthProvider";

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

import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "Personal Developer Task Manager",
  description: "Minimalist, professional task management for software developers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-page text-main antialiased selection:bg-brand-indigo-subtle selection:text-brand-indigo">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "DropZero — zero oversells at global scale",
  description:
    "Oversell-proof global live-drops on Aurora DSQL + Vercel. Zero oversells. Zero cold starts. Zero ops.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabelCheck | Alcohol Label Review",
  description: "Compare alcohol label artwork with application details using private, on-device OCR.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

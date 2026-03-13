import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-sans",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "Daily Spend",
  description: "Daily spending tracker with analytics and simple ML forecast",
  icons: {
    icon: [{ url: "/images/LOGO.png", type: "image/png" }],
    apple: [{ url: "/images/LOGO.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} min-h-screen text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}

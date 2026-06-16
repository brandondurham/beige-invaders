import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import { cn } from "@/lib/utils";
import Logo from "./components/Logo";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://beige.andrewalfordcreative.com"),
  title: "Beige Invaders → Andrew Alford Creative",
  description: "Andrew Alford Creative",
  openGraph: {
    title: "Beige Invaders → Andrew Alford Creative",
    description: "Andrew Alford Creative",
    url: "https://beige.andrewalfordcreative.com",
    siteName: "Beige Invaders",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beige Invaders → Andrew Alford Creative",
    description: "Andrew Alford Creative",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={cn("dark", "font-mono", jetbrainsMono.variable)} data-theme="dark" lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed left-1/2 top-1/2 h-screen w-screen scale-[1.17] bg-cover bg-center bg-fixed bg-[url(/space-r.png)] translate-x-[-50%] translate-y-[-56%] origin-center" />
        <div className="bg-black fixed inset-0 opacity-0" />
        <AntdRegistry>
          {children}
        </AntdRegistry>
        <a className="block" href="https://andrewalfordcreative.com"><Logo className='fixed top-4 left-4 w-[120px] z-50 text-green-400 opacity-85' /></a>
      </body>
    </html>
  );
}

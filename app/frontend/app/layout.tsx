import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "../providers/Web3Provider";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "BotLend | Decentralized Lending & Borrowing on BOT Chain Mainnet",
  description:
    "Overcollateralized decentralized lending and borrowing protocol natively built on BOT Chain Mainnet (Chain ID 677).",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c14] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Web3Provider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}

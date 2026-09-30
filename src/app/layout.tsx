import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "ระบบรับบริจาคดวงตา",
  description: "Eye Donation Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${prompt.variable} h-full antialiased`}>
      <body className="min-h-full flex font-sans">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-zinc-50/50">
          {children}
        </main>
      </body>
    </html>
  );
}

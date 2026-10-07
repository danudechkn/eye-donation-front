import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

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
      <body className="min-h-full font-sans antialiased text-slate-800">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNavBar } from "@/components/BottomNavBar";
import { AuthGate } from "@/components/AuthGate";
import { NotificationScheduler } from "@/components/NotificationScheduler";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#191919",
};

export const metadata: Metadata = {
  title: "RealityCheck // Forge",
  description: "Disciplined Execution & Habit Alignment Engine",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Forge",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#191919] text-[#E3E3E3]">
      <body className="min-h-full flex flex-col bg-[#191919] antialiased">
        <AuthGate>
          <NotificationScheduler />
          <div className="flex-1 pb-24">
            {children}
          </div>
          <BottomNavBar />
        </AuthGate>
      </body>
    </html>
  );
}

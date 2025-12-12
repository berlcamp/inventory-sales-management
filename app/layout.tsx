// app/layout.tsx (Server Component)
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import MainSidebar from "@/components/Sidebars/MainSidebar";
import { getSupabaseClient } from "@/lib/supabase/server";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

import Maintenance from "@/components/Maintenance";
import { OfflineDetector } from "@/components/OfflineDetector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory-Sales-Management",
  description: "Inventory-Sales-Management by BTC",
  openGraph: {
    title: "Inventory Sales Management",
    description: "Inventory Sales Management",
    images: [
      {
        url: "https://ac23.ph/bg.png", // Full URL to the image
        width: 964,
        height: 608,
        alt: "Asenso Pinoy Membership",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMaintenance = true;

  if (isMaintenance) {
    return (
      <html lang="en">
        <body>
          <Maintenance />
        </body>
      </html>
    );
  }
  return (
    <html lang="en">
      <body
        className={`dark:bg-[#191919] ${!user ? "min-h-screen bg-white" : ""}`}
      >
        <Toaster />
        <Providers>
          <OfflineDetector /> {/* Show when offline */}
          {!user && children}
          {user && (
            <>
              <Header />
              <div className="flex">
                <Sidebar>
                  <MainSidebar />
                </Sidebar>
                <div className="flex-1">
                  <AuthGuard>
                    <main className="p-4 mt-16">{children}</main>
                  </AuthGuard>
                  {/* Add margin-top to prevent overlap */}
                </div>
              </div>
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}

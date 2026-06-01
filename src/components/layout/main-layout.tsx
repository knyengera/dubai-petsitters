"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./navbar";
import Footer from "./footer";
import BottomTab from "./bottom-tab";
import TopHeader from "./top-header";
import { PageHeroFromPath } from "./page-hero";
import PetHealthAssistantWidget from "@/components/ai/pet-health-assistant-widget";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSubPage =
    pathname.startsWith("/blog/") || pathname === "/settings";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <TopHeader />
      <main
        className="flex-1 lg:pt-20 pb-20 lg:pb-0"
        style={{
          paddingTop: isSubPage
            ? "calc(52px + env(safe-area-inset-top))"
            : "calc(64px + env(safe-area-inset-top))",
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
        }}
      >
        <PageHeroFromPath pathname={pathname} />
        {children}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <BottomTab />
      <Suspense fallback={null}>
        <PetHealthAssistantWidget />
      </Suspense>
    </div>
  );
}

'use client';

import { Navigation } from "@/components/layout";
import DashboardSidebar from "@/components/ui/DashboardSidebar";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useUserProfile();
  
  // Only show DashboardSidebar for admin and quality_controller users
  const showDashboardSidebar = profile?.role === 'admin' || profile?.role === 'quality_controller';

  return (
    <>
      <Navigation />
      {showDashboardSidebar && <DashboardSidebar />}
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}

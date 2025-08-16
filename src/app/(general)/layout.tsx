import { Navigation } from "@/components/layout";
import DashboardSidebar from "@/components/ui/DashboardSidebar";

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <DashboardSidebar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/infrastructure/auth/auth';
import { DashboardNav } from '@/shared/ui/dashboard-nav';
import { DashboardHeader } from '@/shared/ui/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

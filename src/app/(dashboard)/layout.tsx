import { redirect } from 'next/navigation';
import { auth } from '@/infrastructure/auth/auth';
import { DashboardShell } from '@/shared/ui/dashboard-sidebar';
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
    <DashboardShell header={<DashboardHeader />}>{children}</DashboardShell>
  );
}

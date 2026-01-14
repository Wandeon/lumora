import { auth } from '@/infrastructure/auth/auth';

export async function DashboardHeader() {
  const session = await auth();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400">{session.user.email}</p>
            </div>
            <div
              className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-white font-semibold">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

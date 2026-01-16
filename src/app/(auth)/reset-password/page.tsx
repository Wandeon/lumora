import Link from 'next/link';
import { ResetPasswordForm } from '@/shared/ui/reset-password-form';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Lumora</h1>
          <p className="text-gray-400 mt-1">Create a new password</p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="text-center">
            <p className="text-red-400">Invalid or missing reset token.</p>
            <Link
              href="/forgot-password"
              className="text-emerald-400 hover:underline mt-4 inline-block"
            >
              Request a new reset link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

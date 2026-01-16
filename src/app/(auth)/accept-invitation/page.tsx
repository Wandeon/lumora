import Link from 'next/link';
import { AcceptInvitationForm } from '@/shared/ui/accept-invitation-form';

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function AcceptInvitationPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  const hasValidParams = token && email;

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Lumora</h1>
          <p className="text-gray-400 mt-1">Accept your invitation</p>
        </div>

        {hasValidParams ? (
          <AcceptInvitationForm
            token={token}
            email={decodeURIComponent(email)}
          />
        ) : (
          <div className="text-center">
            <p className="text-red-400">Invalid or missing invitation link.</p>
            <p className="text-gray-400 mt-2 text-sm">
              Please check your email for the correct invitation link.
            </p>
            <Link
              href="/login"
              className="text-emerald-400 hover:underline mt-4 inline-block"
            >
              Go to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

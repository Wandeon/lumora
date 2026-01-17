import { SignupForm } from '@/shared/ui/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Lumora account and start your free trial.',
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md relative">
      <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">
            Create Your Studio
          </h1>
          <p className="text-stone-500 mt-1">Start your 14-day free trial</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}

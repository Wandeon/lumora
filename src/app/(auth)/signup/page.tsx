import { SignupForm } from '@/shared/ui/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Lumora account and start your free trial.',
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Create Your Studio</h1>
          <p className="text-gray-400 mt-1">Start your 14-day free trial</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}

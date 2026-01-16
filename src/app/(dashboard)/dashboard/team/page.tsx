'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'pending';
  createdAt: string;
  lastLoginAt: string | null;
}

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Invitation form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/team/invitations');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.status === 403) {
        setError('You do not have permission to view team members');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      const data = await response.json();
      setMembers(data);
    } catch {
      setError('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/dashboard/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccessMessage(`Invitation sent to ${email}`);
      setEmail('');
      setRole('viewer');
      fetchMembers(); // Refresh the list
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (roleValue: string): string => {
    const labels: Record<string, string> = {
      owner: 'Vlasnik',
      admin: 'Administrator',
      editor: 'Urednik',
      viewer: 'Preglednik',
    };
    return labels[roleValue] || roleValue;
  };

  const getRoleBadgeClass = (roleValue: string): string => {
    const classes: Record<string, string> = {
      owner: 'bg-purple-500/20 text-purple-400',
      admin: 'bg-blue-500/20 text-blue-400',
      editor: 'bg-emerald-500/20 text-emerald-400',
      viewer: 'bg-gray-500/20 text-gray-400',
    };
    return classes[roleValue] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    if (status === 'pending') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
          Ceka prihvat
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
        Aktivan
      </span>
    );
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Tim</h1>
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400">Ucitavanje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Tim</h1>
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-rose-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Tim</h1>

      {/* Invitation Form */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Pozovi novog clana
        </h2>
        <form
          onSubmit={handleInvite}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <label htmlFor="email" className="sr-only">
              Email adresa
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@primjer.com"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="sm:w-40">
            <label htmlFor="role" className="sr-only">
              Uloga
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'admin' | 'editor' | 'viewer')
              }
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                         text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="viewer">Preglednik</option>
              <option value="editor">Urednik</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg
                       hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                       whitespace-nowrap"
          >
            {isSubmitting ? 'Slanje...' : 'Posalji pozivnicu'}
          </button>
        </form>

        {formError && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
            <p className="text-sm text-rose-400">{formError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <p className="text-sm text-emerald-400">{successMessage}</p>
          </div>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Clanovi tima ({members.length})
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">Nemate jos nijednog clana u timu</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Clan
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Uloga
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Zadnja prijava
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-gray-400 text-sm">{member.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass(member.role)}`}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(member.status)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString('hr-HR')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">
          Uloge i dozvole
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass('owner')}`}
            >
              Vlasnik
            </span>
            <p className="text-gray-400">
              Potpuna kontrola nad svim postavkama i fakturiranjem
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass('admin')}`}
            >
              Administrator
            </span>
            <p className="text-gray-400">
              Moze upravljati timom i svim galerije
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass('editor')}`}
            >
              Urednik
            </span>
            <p className="text-gray-400">Moze kreirati i uredivati galerije</p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass('viewer')}`}
            >
              Preglednik
            </span>
            <p className="text-gray-400">
              Moze samo pregledavati galerije i narudzbe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

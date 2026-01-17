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
      owner: 'Owner',
      admin: 'Admin',
      editor: 'Editor',
      viewer: 'Viewer',
    };
    return labels[roleValue] || roleValue;
  };

  const getRoleBadgeClass = (roleValue: string): string => {
    const classes: Record<string, string> = {
      owner: 'bg-purple-50 text-purple-700',
      admin: 'bg-blue-50 text-blue-700',
      editor: 'bg-emerald-50 text-emerald-700',
      viewer: 'bg-stone-100 text-stone-600',
    };
    return classes[roleValue] || 'bg-stone-100 text-stone-600';
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    if (status === 'pending') {
      return (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700">
          Pending
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
        Active
      </span>
    );
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Team</h1>
        <div className="bg-white rounded-xl p-8 text-center border border-stone-200 shadow-sm">
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Team</h1>
        <div className="bg-white rounded-xl p-8 text-center border border-stone-200 shadow-sm">
          <p className="text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Team</h1>

      {/* Invitation Form */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Invite Team Member
        </h2>
        <form
          onSubmit={handleInvite}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                         text-stone-900 placeholder:text-stone-400
                         focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                         transition-colors"
            />
          </div>
          <div className="sm:w-40">
            <label htmlFor="role" className="sr-only">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'admin' | 'editor' | 'viewer')
              }
              className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                         text-stone-900
                         focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                         transition-colors"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg
                       hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
                       whitespace-nowrap transition-colors shadow-sm"
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>

        {formError && (
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3">
            <p className="text-sm text-rose-600">{formError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-700">{successMessage}</p>
          </div>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">
            Team Members ({members.length})
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-stone-500">No team members yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-stone-900 font-medium">{member.name}</p>
                      <p className="text-stone-500 text-sm">{member.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(member.role)}`}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(member.status)}</td>
                  <td className="px-4 py-3 text-stone-500 text-sm">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="mt-6 bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Roles & Permissions
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass('owner')}`}
            >
              Owner
            </span>
            <p className="text-stone-600">
              Full control over all settings and billing
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass('admin')}`}
            >
              Admin
            </span>
            <p className="text-stone-600">
              Can manage team and all galleries
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass('editor')}`}
            >
              Editor
            </span>
            <p className="text-stone-600">Can create and edit galleries</p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass('viewer')}`}
            >
              Viewer
            </span>
            <p className="text-stone-600">
              Can only view galleries and orders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

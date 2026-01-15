'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Gallery } from '@/generated/prisma';

interface Props {
  gallery: Gallery;
}

export function GalleryEditForm({ gallery }: Props) {
  const [title, setTitle] = useState(gallery.title);
  const [description, setDescription] = useState(gallery.description || '');
  const [visibility, setVisibility] = useState(gallery.visibility);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/dashboard/galleries/${gallery.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, visibility }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update gallery');
        return;
      }

      router.push('/dashboard/galleries');
      router.refresh();
    } catch {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/dashboard/galleries/${gallery.id}/publish`, {
        method: 'POST',
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Gallery Code
        </label>
        <input
          type="text"
          value={gallery.code}
          disabled
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">
          Share this code with your clients
        </p>
      </div>

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label
          htmlFor="visibility"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Visibility
        </label>
        <select
          id="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof visibility)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
        >
          <option value="public">Public - Anyone with the link</option>
          <option value="code_protected">
            Code Protected - Requires access code
          </option>
          <option value="private">Private - Only you</option>
        </select>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              gallery.status === 'published'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            {gallery.status}
          </span>
        </div>
        {gallery.status === 'draft' && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Publish Gallery
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-600 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

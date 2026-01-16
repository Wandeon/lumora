'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface PhotoUploaderProps {
  galleryId: string;
  onComplete?: () => void;
}

export function PhotoUploader({ galleryId, onComplete }: PhotoUploaderProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    setUploads((prev) => [
      ...prev,
      { filename: file.name, progress: 0, status: 'uploading' },
    ]);

    try {
      const response = await fetch(
        `/api/dashboard/galleries/${galleryId}/photos`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      setUploads((prev) =>
        prev.map((u) =>
          u.filename === file.name
            ? { ...u, progress: 100, status: 'complete' }
            : u
        )
      );
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.filename === file.name
            ? { ...u, status: 'error', error: (error as Error).message }
            : u
        )
      );
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
      );

      if (validFiles.length === 0) return;

      setIsUploading(true);

      for (const file of validFiles) {
        await uploadFile(file);
      }

      setIsUploading(false);
      router.refresh();
      onComplete?.();
    },
    [galleryId, onComplete, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input
          type="file"
          id="photo-upload"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          disabled={isUploading}
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-300">
            {isUploading
              ? 'Uploading...'
              : 'Drop photos here or click to browse'}
          </span>
          <span className="text-sm text-gray-500">
            JPEG, PNG, or WebP up to 50MB each
          </span>
        </label>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, i) => (
            <div
              key={`${upload.filename}-${i}`}
              className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{upload.filename}</p>
                {upload.status === 'error' && (
                  <p className="text-xs text-rose-400">{upload.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {upload.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
                {upload.status === 'complete' && (
                  <svg
                    className="w-5 h-5 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {upload.status === 'error' && (
                  <svg
                    className="w-5 h-5 text-rose-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

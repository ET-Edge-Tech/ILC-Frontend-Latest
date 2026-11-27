import { ImageOff } from 'lucide-react';
import { usePrivateUrl } from './photo-hooks.js';

// A picture that is not public: it asks the server for a short-lived link first.
export default function PrivateImage({ fileId, alt = '', className = '' }) {
  const { data: url, isError } = usePrivateUrl(fileId);
  if (isError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}>
        <ImageOff className="h-6 w-6" aria-label="This photo could not be loaded" />
      </div>
    );
  }
  if (!url) return <div className={`animate-pulse bg-gray-100 ${className}`} aria-hidden="true" />;
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}

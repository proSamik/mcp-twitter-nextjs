"use client";

import React from "react";
import Image from "next/image";
import { useSignedMediaUrl } from "@/hooks/useSignedMediaUrl";
import { Play, AlertCircle, Loader2 } from "lucide-react";

interface SecureMediaProps {
  mediaKey: string;
  alt?: string;
  className?: string;
  showPlayIcon?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

/**
 * Secure media component that uses signed URLs
 * Automatically handles URL generation, caching, and refresh
 */
export function SecureMedia({
  mediaKey,
  alt = "Media preview",
  className = "",
  showPlayIcon = true,
  onLoad,
  onError,
}: SecureMediaProps) {
  const { url, loading, error, refresh } = useSignedMediaUrl(mediaKey);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  React.useEffect(() => {
    if (url && onLoad) {
      onLoad();
    }
  }, [url, onLoad]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-500">Failed to load</p>
          <button
            onClick={refresh}
            className="text-xs text-blue-500 hover:underline mt-1"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-xs text-muted-foreground">No media</div>
      </div>
    );
  }

  const isVideo =
    mediaKey.includes(".mp4") ||
    mediaKey.includes(".mov") ||
    mediaKey.includes(".webm");

  if (isVideo) {
    return (
      <div className={`relative ${className}`}>
        <video
          src={url}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          preload="metadata"
        />
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-6 w-6 text-white drop-shadow-lg" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      onLoad={() => onLoad?.()}
      onError={() => onError?.("Failed to load image")}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

/**
 * Media grid component for multiple media items
 */
interface SecureMediaGridProps {
  mediaKeys: string[];
  className?: string;
  onMediaLoad?: (index: number) => void;
  onMediaError?: (index: number, error: string) => void;
}

export function SecureMediaGrid({
  mediaKeys,
  className = "",
  onMediaLoad,
  onMediaError,
}: SecureMediaGridProps) {
  if (mediaKeys.length === 0) return null;

  const getGridCols = () => {
    if (mediaKeys.length === 1) return "grid-cols-1";
    if (mediaKeys.length === 2) return "grid-cols-2";
    return "grid-cols-2";
  };

  return (
    <div className={`grid gap-2 ${getGridCols()} max-w-sm ${className}`}>
      {mediaKeys.map((mediaKey, index) => (
        <div key={index} className="relative border rounded-lg overflow-hidden">
          <div className="aspect-square bg-muted relative w-full">
            <SecureMedia
              mediaKey={mediaKey}
              alt={`Media ${index + 1}`}
              onLoad={() => onMediaLoad?.(index)}
              onError={(error) => onMediaError?.(index, error)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, Star, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  uploadAppFile,
  type UploadBucket,
  type UploadCategory,
} from "@/lib/storage/upload";

type GalleryImageUploadProps = {
  coverUrl: string;
  galleryUrls: string[];
  onChange: (cover: string, gallery: string[]) => void;
  category: UploadCategory;
  label?: string;
  maxImages?: number;
  bucket?: UploadBucket;
  className?: string;
};

export default function GalleryImageUpload({
  coverUrl,
  galleryUrls,
  onChange,
  category,
  label = "Add photos",
  maxImages = 8,
  bucket = "public-uploads",
  className = "",
}: GalleryImageUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const images = [coverUrl, ...galleryUrls].filter(Boolean);
  const disabled = uploading || !user;
  const atLimit = images.length >= maxImages;

  const emit = (next: string[]) => {
    onChange(next[0] ?? "", next.slice(1));
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload images.",
        variant: "destructive",
      });
      return;
    }

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast({
        title: "Image limit reached",
        description: `You can upload up to ${maxImages} images.`,
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const url = await uploadAppFile(bucket, file, user.id, category, category);
        uploaded.push(url);
      }
      emit([...images, ...uploaded]);
      if (files.length > remaining) {
        toast({
          title: "Some images skipped",
          description: `Only ${remaining} more image${remaining === 1 ? "" : "s"} could be added (limit ${maxImages}).`,
        });
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const setAsCover = (url: string) => {
    emit([url, ...images.filter((u) => u !== url)]);
  };

  const removeImage = (url: string) => {
    emit(images.filter((u) => u !== url));
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {images.map((url, i) => (
            <div
              key={url}
              className={`group relative aspect-square overflow-hidden rounded-xl border bg-muted ${
                i === 0 ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              <img src={url} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="h-2.5 w-2.5 fill-current" /> Cover
                </span>
              )}
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 ? (
                  <button
                    type="button"
                    onClick={() => setAsCover(url)}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-white"
                  >
                    Set cover
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="rounded-md bg-white/90 p-1 text-foreground hover:bg-white hover:text-destructive"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {!atLimit && (
            <button
              type="button"
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/60"
              }`}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {images.length === 0 && (
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
          className={`flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/60"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">{label}</span>
            </>
          )}
        </button>
      )}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {images.length} of {maxImages} images. The cover photo appears first on your listing.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
        disabled={disabled}
      />
    </div>
  );
}

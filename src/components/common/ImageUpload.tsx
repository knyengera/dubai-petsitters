"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  uploadAppFile,
  type UploadBucket,
  type UploadCategory,
} from "@/lib/storage/upload";

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  category: UploadCategory;
  label?: string;
  className?: string;
  variant?: "square" | "circle" | "wide";
  bucket?: UploadBucket;
  uploadLabel?: string;
};

export default function ImageUpload({
  value,
  onChange,
  category,
  label = "Upload Image",
  className = "",
  variant = "square",
  bucket = "public-uploads",
  uploadLabel,
}: ImageUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload images.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadAppFile(
        bucket,
        file,
        user.id,
        category,
        uploadLabel ?? category
      );
      onChange(url);
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

  const shapeClass = {
    circle: "rounded-full w-24 h-24",
    square: "rounded-2xl w-24 h-24",
    wide: "rounded-2xl w-full h-40",
  }[variant];

  const disabled = uploading || !user;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`relative overflow-hidden border-2 border-dashed border-border bg-muted flex items-center justify-center transition-colors ${shapeClass} ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/60"
        }`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : value ? (
          <>
            <img src={value} alt="Upload" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground p-3 text-center">
            <ImageIcon className="w-6 h-6" />
            {variant !== "circle" && <span className="text-[10px]">Click to upload</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
        >
          {value ? "Change" : label}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={disabled}
      />
    </div>
  );
}

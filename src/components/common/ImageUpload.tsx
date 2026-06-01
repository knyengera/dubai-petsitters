"use client";

import { useState, useRef } from 'react';
import { base44 } from "@/lib/data";
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

/**
 * Reusable image upload component.
 * Props:
 *  - value: current image URL (string)
 *  - onChange: called with the uploaded file URL
 *  - label: optional label text
 *  - className: wrapper class
 *  - variant: 'square' (default) | 'circle' | 'wide'
 */
export default function ImageUpload({ value, onChange, label = 'Upload Image', className = '', variant = 'square' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file });
    onChange(res.file_url);
    setUploading(false);
  };

  const shapeClass = {
    circle: 'rounded-full w-24 h-24',
    square: 'rounded-2xl w-24 h-24',
    wide: 'rounded-2xl w-full h-40',
  }[variant];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`relative overflow-hidden border-2 border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:border-primary/60 transition-colors ${shapeClass}`}
        onClick={() => !uploading && inputRef.current?.click()}
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
            {variant !== 'circle' && <span className="text-[10px]">Click to upload</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          className="text-xs font-medium text-primary hover:underline"
        >
          {value ? 'Change' : label}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
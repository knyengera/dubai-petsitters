const CONVERTIBLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
]);

const SKIP_CONVERSION_TYPES = new Set([
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

export type WebpConversionOptions = {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
};

const DEFAULT_OPTIONS: Required<WebpConversionOptions> = {
  quality: 0.85,
  maxWidth: 2048,
  maxHeight: 2048,
};

function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base || "upload"}.${ext}`;
}

function scaleDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export function shouldConvertImageToWebp(file: File): boolean {
  if (SKIP_CONVERSION_TYPES.has(file.type)) return false;
  if (CONVERTIBLE_IMAGE_TYPES.has(file.type)) return true;
  return file.type.startsWith("image/") && file.type !== "image/*";
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image for WebP conversion."));
    };

    image.src = url;
  });
}

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("WebP conversion produced an empty file."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

/**
 * Converts raster images to WebP before upload. Non-image files, GIFs, SVGs,
 * PDFs, and files that are already WebP are returned unchanged.
 */
export async function convertImageToWebp(
  file: File,
  options: WebpConversionOptions = {}
): Promise<File> {
  if (!shouldConvertImageToWebp(file)) return file;

  const { quality, maxWidth, maxHeight } = { ...DEFAULT_OPTIONS, ...options };

  try {
    const image = await loadImageFromFile(file);
    const { width, height } = scaleDimensions(
      image.naturalWidth,
      image.naturalHeight,
      maxWidth,
      maxHeight
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not available for WebP conversion.");
    }

    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToWebpBlob(canvas, quality);

    return new File([blob], replaceExtension(file.name, "webp"), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/** Prepare a file for Storage upload (images → WebP when possible). */
export async function prepareImageForUpload(
  file: File,
  options?: WebpConversionOptions
): Promise<File> {
  return convertImageToWebp(file, options);
}

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loading } from "./loading";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  label?: string;
  previewClassName?: string;
  value?: string; // Add value prop to handle existing image
}

export function ImageUpload({
  onUploadSuccess,
  onUploadError,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
  },
  className = "",
  label = "Image Upload",
  previewClassName = "max-h-32 mx-auto",
  value = "" // Initialize with empty string
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file size
    if (file.size > maxSize) {
      const error = `File size must be less than ${maxSize / 1024 / 1024}MB`;
      console.log('File size validation failed:', error);
      toast.error(error);
      return;
    }

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending file to server...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload image';
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Upload successful:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Update the preview URL with the actual uploaded image URL
      setPreviewUrl(data.url);
      onUploadSuccess(data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
      setPreviewUrl(value || null); // Reset to previous value or null
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, onUploadError, onUploadSuccess, value]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize,
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isUploading ? (
          <Loading text="Uploading..." />
        ) : previewUrl ? (
          <div>
            <img
              src={previewUrl}
              alt="Preview"
              className={previewClassName}
            />
            <p className="mt-2 text-sm text-gray-500">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports: {Object.values(accept).flat().join(', ')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max size: {maxSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
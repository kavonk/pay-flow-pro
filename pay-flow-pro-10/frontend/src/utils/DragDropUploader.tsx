import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DragDropUploaderProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  currentLogo?: string;
  disabled?: boolean;
}

export const DragDropUploader: React.FC<DragDropUploaderProps> = ({
  onUpload,
  uploading,
  currentLogo,
  disabled
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, [disabled]);

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    onUpload(file);
  };

  const clearPreview = () => {
    setPreview(null);
  };

  const triggerFileInput = () => {
    if (!disabled) {
      document.getElementById('logo-file-input')?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Logo Display */}
      {(currentLogo || preview) && (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
          <div className="relative">
            <img 
              src={preview || currentLogo} 
              alt="Logo preview" 
              className="h-16 w-auto max-w-24 object-contain rounded border"
            />
            {preview && (
              <button
                onClick={clearPreview}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">
              {preview ? 'Preview (not saved)' : 'Current Logo'}
            </p>
            <p className="text-xs text-gray-500">
              Logo will appear on invoices and emails
            </p>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}`}
        onDrag={handleDrag}
        onDragStart={handleDrag}
        onDragEnd={handleDrag}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          id="logo-file-input"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-4">
          {uploading ? (
            <>
              <RefreshCw className="mx-auto w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-blue-600">Uploading...</p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {dragOver ? (
                  <Upload className="w-8 h-8 text-blue-500" />
                ) : (
                  <Image className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {dragOver ? 'Drop your logo here' : 'Upload Company Logo'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop or click to browse • PNG, JPG, SVG • Max 5MB
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="mt-4"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload Guidelines */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>Logo Guidelines:</strong> For best results, use a transparent PNG with your logo on a white background. 
          Recommended size: 200x80px or similar aspect ratio.
        </AlertDescription>
      </Alert>

      {disabled && (
        <Alert>
          <AlertDescription className="text-sm">
            Upgrade to Pro plan to upload custom logos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
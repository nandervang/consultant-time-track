import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, User, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  className?: string;
  label?: string;
  description?: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

export function ImageUpload({
  value,
  onChange,
  className,
  label = "Profile Photo",
  description = "Upload a professional profile photo (JPG, PNG, WebP)",
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!acceptedFormats.includes(file.type)) {
      alert(`Please select a valid image format: ${acceptedFormats.join(', ')}`);
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert to base64 for now (in a real app, you'd upload to a service)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragOver && "border-primary bg-primary/5",
          !value && "hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!value ? handleButtonClick : undefined}
      >
        <CardContent className="p-6">
          {value ? (
            // Preview mode
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={value} alt="Profile photo" className="object-cover" />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Profile photo uploaded</p>
                <p className="text-xs text-muted-foreground">
                  Click to change or drag a new image here
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleButtonClick();
                    }}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Upload mode
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {isUploading ? 'Uploading...' : 'Upload profile photo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxSize}MB • {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleButtonClick}
                disabled={isUploading}
                className="mx-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload profile photo"
        title="Upload profile photo"
      />
      
      {description && !value && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
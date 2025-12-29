import { useState } from 'react';
import { useUploadProductVariantImage } from '@/core/api/generated/spring';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ExistingVariantRow } from './types';

interface VariantImageUploaderProps {
  variant: ExistingVariantRow;
  onUploadComplete: () => void;
}

export function VariantImageUploader({
  variant,
  onUploadComplete,
}: VariantImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadVariantImage = useUploadProductVariantImage();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected', {
        description: 'Please select an image file to upload.',
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadVariantImage.mutateAsync({
        data: { file: selectedFile },
        params: { variantId: variant.id },
      });
      toast.success('Upload successful', {
        description: 'The variant image has been uploaded.',
      });
      onUploadComplete();
    } catch (error) {
      toast.error('Upload failed', {
        description: 'There was an error uploading the image.',
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <Input type="file" onChange={handleFileChange} accept="image/*" />
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-2">Upload</span>
        </Button>
      </div>
    </div>
  );
}

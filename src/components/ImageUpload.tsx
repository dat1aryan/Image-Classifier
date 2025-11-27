import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClassificationResult } from "@/pages/Index";

interface ImageUploadProps {
  onClassification: (result: ClassificationResult) => void;
}

const ImageUpload = ({ onClassification }: ImageUploadProps) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const classifyImages = async () => {
    if (images.length === 0) return;

    setIsClassifying(true);

    try {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const preview = previews[i];

        // Convert image to base64
        const base64 = preview.split(",")[1];

        const { data, error } = await supabase.functions.invoke("classify-livestock", {
          body: { image: `data:${file.type};base64,${base64}` },
        });

        if (error) {
          console.error("Classification error:", error);
          toast({
            title: "Classification failed",
            description: error.message || "Failed to classify image",
            variant: "destructive",
          });
          continue;
        }

        const result: ClassificationResult = {
          id: `${Date.now()}-${i}`,
          image: preview,
          prediction: data.prediction,
          confidence: data.confidence,
          features: data.features,
          timestamp: Date.now(),
        };

        onClassification(result);
      }

      toast({
        title: "Classification complete",
        description: `Successfully classified ${images.length} image${images.length > 1 ? "s" : ""}`,
      });

      // Clear images after successful classification
      setImages([]);
      setPreviews([]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Images</h2>
        <p className="text-muted-foreground">
          Upload one or more images to classify as cattle or buffalo
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.98]"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground mb-1">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, WEBP up to 20MB
            </p>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            Selected Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border border-border bg-card aspect-square"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground
                           opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classify Button */}
      <Button
        onClick={classifyImages}
        disabled={images.length === 0 || isClassifying}
        className="w-full"
        size="lg"
      >
        {isClassifying ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Classifying...
          </>
        ) : (
          <>Classify {images.length > 0 ? `${images.length} Image${images.length > 1 ? "s" : ""}` : "Images"}</>
        )}
      </Button>
    </div>
  );
};

export default ImageUpload;

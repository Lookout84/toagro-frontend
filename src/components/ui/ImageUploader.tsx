import React, { useState } from "react";
import { Upload, X, Plus } from "lucide-react";

interface ImageUploaderProps {
  images: File[];
  onChange: (newImages: (File | string)[]) => void;
  onRemove: (index: number) => void;
  error?: string;
  existingImages?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  onRemove,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    images.map((img) => URL.createObjectURL(img))
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    handleFiles(Array.from(files));
  };

  const handleFiles = (files: File[]) => {
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const imageFiles = files.filter((file) =>
      validImageTypes.includes(file.type)
    );

    if (imageFiles.length === 0) {
      // Можна додати проп для callback при помилці
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = imageFiles.filter(
      (file) => file.size > MAX_FILE_SIZE
    );
    if (oversizedFiles.length > 0) {
      // Можна додати проп для callback при помилці
      return;
    }

    const totalImages = images.length + imageFiles.length;
    if (totalImages > 10) {
      // Можна додати проп для callback при помилці
      return;
    }

    const newImages = [...images, ...imageFiles];
    const newPreviewUrls = [
      ...previewUrls,
      ...imageFiles.map((file) => URL.createObjectURL(file)),
    ];

    setPreviewUrls(newPreviewUrls);
    onChange(newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
    onRemove(index);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Фотографії *
      </label>
      <div
        className={`border-2 border-dashed ${
          isDragging ? "border-green-500 bg-green-50" : "border-gray-300"
        } rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("image-upload")?.click()}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload size={36} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-700 mb-1">
          Перетягніть зображення сюди або натисніть, щоб вибрати
        </p>
        <p className="text-xs text-gray-500">
          Підтримувані формати: JPEG, PNG, GIF, WEBP. Максимум 10 фото, до 5MB
          кожне.
        </p>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {previewUrls.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Завантажені зображення ({previewUrls.length}/10)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className="relative aspect-w-1 aspect-h-1 rounded-md overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`Зображення ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
            {previewUrls.length < 10 && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Plus size={24} className="text-gray-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

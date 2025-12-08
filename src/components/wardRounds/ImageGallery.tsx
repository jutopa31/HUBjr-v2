import React, { useState } from 'react';
import { Image, Maximize2, Trash2, ExternalLink, Camera } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{ thumbnail: string; full: string; exa?: string | null }>;
  onImagesChange?: (images: Array<{ thumbnail: string; full: string; exa?: string | null }>) => void;
  onUpload?: (files: FileList) => Promise<void>;
  isEditable?: boolean;
  isUploading?: boolean;
  uploadProgress?: { uploaded: number; total: number };
  mode?: 'compact' | 'grid';
}

export default function ImageGallery({
  images,
  onImagesChange,
  onUpload,
  isEditable = false,
  isUploading = false,
  uploadProgress,
  mode = 'grid'
}: ImageGalleryProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Drag & Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && onUpload) {
      onUpload(files);
    }
  };

  // Delete Image Handler
  const handleDeleteImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!onImagesChange) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  // File Input Handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onUpload) {
      onUpload(files);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Compact Mode - for cards (read-only)
  if (mode === 'compact') {
    if (images.length === 0) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        {images.slice(0, 3).map((img, i) => (
          <img
            key={i}
            src={img.thumbnail}
            alt={`Imagen ${i + 1}`}
            className="h-[60px] w-[60px] object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              /* parent handles lightbox */
            }}
          />
        ))}
        {images.length > 3 && (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            +{images.length - 3} más
          </span>
        )}
      </div>
    );
  }

  // Grid Mode - for detail modal
  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4 md:grid-cols-2 sm:grid-cols-1">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Image */}
              <img
                src={img.thumbnail}
                alt={`Imagen ${index + 1}`}
                className="h-[150px] w-full object-cover rounded-md cursor-pointer transition-transform hover:scale-105"
                onClick={() => {
                  /* parent handles lightbox */
                }}
              />

              {/* EXA Badge */}
              {img.exa && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shadow-md">
                  <ExternalLink className="h-3 w-3" />
                  <span>EXA</span>
                </div>
              )}

              {/* Hover Overlay */}
              {hoveredIndex === index && (
                <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center gap-3 transition-opacity">
                  {/* View Icon */}
                  <button
                    className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                    onClick={() => {
                      /* parent handles lightbox */
                    }}
                    title="Ver imagen completa"
                  >
                    <Maximize2 className="h-5 w-5 text-gray-800" />
                  </button>

                  {/* Delete Icon (only if editable) */}
                  {isEditable && (
                    <button
                      className="p-2 bg-red-500/90 hover:bg-red-600 rounded-full transition-colors"
                      onClick={(e) => handleDeleteImage(e, index)}
                      title="Eliminar imagen"
                    >
                      <Trash2 className="h-5 w-5 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State (when no images in grid mode) */}
      {images.length === 0 && !isEditable && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay imágenes</p>
        </div>
      )}

      {/* Upload Zone (only in grid mode when editable) */}
      {isEditable && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDraggingOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Upload Icon */}
          <Image
            className={`h-12 w-12 mx-auto mb-4 transition-colors ${
              isDraggingOver
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />

          {/* Upload Text */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isDraggingOver
              ? 'Suelta las imágenes aquí'
              : 'Arrastra imágenes aquí o haz click para seleccionar'}
          </p>

          {/* File Input Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            onClick={handleFileButtonClick}
            disabled={isUploading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isUploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {isUploading ? 'Subiendo...' : 'Seleccionar archivos'}
          </button>

          {/* Progress Bar */}
          {isUploading && uploadProgress && (
            <div className="mt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Subiendo imagen {uploadProgress.uploaded} de {uploadProgress.total}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(uploadProgress.uploaded / uploadProgress.total) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

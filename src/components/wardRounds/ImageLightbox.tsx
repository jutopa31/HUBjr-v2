import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxProps {
  images: Array<{ thumbnail: string; full: string; exa?: string | null }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate?: (newIndex: number) => void;
}

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate
}: ImageLightboxProps) {
  const currentImage = images[currentIndex];

  const handleNavigate = (direction: 'prev' | 'next') => {
    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < images.length - 1) {
      newIndex = currentIndex + 1;
    }
    onNavigate?.(newIndex);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.full;
    link.download = `imagen-${currentIndex + 1}.jpg`;
    link.target = '_blank';
    link.click();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay itself, not the image
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handleNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        handleNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Visor de imágenes"
      className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent z-10">
        {/* Image Counter */}
        <div className="text-white font-medium text-lg">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 bg-black/50 hover:bg-black/70 rounded transition-all text-white"
            aria-label="Descargar imagen"
            title="Descargar imagen"
          >
            <Download className="h-5 w-5" />
          </button>

          {/* Open EXA Button */}
          {currentImage.exa && (
            <a
              href={currentImage.exa}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-black/50 hover:bg-black/70 rounded transition-all text-white flex items-center gap-2"
              aria-label="Abrir EXA"
              title="Abrir EXA en nueva pestaña"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">Abrir EXA</span>
            </a>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 bg-black/50 hover:bg-black/70 rounded transition-all text-white"
            aria-label="Cerrar visor"
            title="Cerrar (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Previous Button */}
      {currentIndex > 0 && (
        <button
          onClick={() => handleNavigate('prev')}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all text-white z-10"
          aria-label="Imagen anterior"
          title="Imagen anterior (←)"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Main Image */}
      <img
        src={currentImage.full}
        alt={`Imagen ${currentIndex + 1} de ${images.length}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      {/* Next Button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => handleNavigate('next')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all text-white z-10"
          aria-label="Imagen siguiente"
          title="Imagen siguiente (→)"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
    </div>
  );
}

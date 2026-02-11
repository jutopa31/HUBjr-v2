import React, { useState } from 'react';
import { Maximize2, Trash2, Film, Image as ImageIcon, X } from 'lucide-react';
import type { MediaItem } from '../../../types/evolucionadorStructured';
import MediaCategoryBadge from './MediaCategoryBadge';

interface MediaGalleryProps {
  items: MediaItem[];
  onDelete: (item: MediaItem) => void;
  onDescriptionChange: (itemId: string, description: string) => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ items, onDelete, onDescriptionChange }) => {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-400">
        No hay archivos cargados.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => {
          const previewUrl = item.signedUrl || item.publicUrl || '';
          return (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-[#0a0a0a]">
              <div className="relative">
                {item.type === 'video' ? (
                  <div className="flex h-36 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800">
                    <Film className="h-8 w-8" />
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt={item.fileName}
                    className="h-36 w-full rounded-lg object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-gray-700 shadow-sm hover:bg-white dark:bg-gray-900/80 dark:text-gray-200"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{item.fileName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <MediaCategoryBadge category={item.category} />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{item.type === 'video' ? 'Video' : 'Imagen'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="rounded-full bg-red-50 p-1 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                value={item.description || ''}
                onChange={(event) => onDescriptionChange(item.id, event.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-200"
                placeholder="Descripcion opcional"
              />
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl dark:bg-[#0a0a0a]">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-3 flex items-center gap-2">
              {selectedItem.type === 'video' ? (
                <Film className="h-4 w-4 text-gray-500" />
              ) : (
                <ImageIcon className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{selectedItem.fileName}</span>
              <MediaCategoryBadge category={selectedItem.category} />
            </div>
            {selectedItem.type === 'video' ? (
              <video controls className="w-full rounded-lg" src={selectedItem.signedUrl || selectedItem.publicUrl} />
            ) : (
              <img
                src={selectedItem.signedUrl || selectedItem.publicUrl}
                alt={selectedItem.fileName}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MediaGallery;

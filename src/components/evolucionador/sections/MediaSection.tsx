import React, { useCallback, useEffect, useState } from 'react';
import MediaUploader from '../media/MediaUploader';
import MediaGallery from '../media/MediaGallery';
import { deleteEvolucionadorMedia, refreshSignedUrls, uploadMultipleMedia } from '../../../services/evolucionadorMediaService';
import type { MediaCategory, MediaItem } from '../../../types/evolucionadorStructured';

interface MediaSectionProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  userId: string | null;
}

const MediaSection: React.FC<MediaSectionProps> = ({ items, onChange, userId }) => {
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const needsRefresh = items.some((item) => !item.signedUrl);
    if (!needsRefresh) return;
    let isMounted = true;
    const refresh = async () => {
      const refreshed = await refreshSignedUrls(items);
      if (!isMounted) return;
      const hasChanges = refreshed.some((item, index) => item.signedUrl !== items[index]?.signedUrl);
      if (hasChanges) onChange(refreshed);
    };
    void refresh();
    return () => {
      isMounted = false;
    };
  }, [items, onChange]);

  const handleUpload = useCallback(
    async (files: File[], category: MediaCategory) => {
      if (!userId) {
        console.warn('[MediaSection] Usuario no autenticado para subir archivos.');
        return;
      }
      setIsUploading(true);
      try {
        const uploadedItems = await uploadMultipleMedia(files, userId, category);
        onChange([...items, ...uploadedItems]);
      } catch (error) {
        console.error('[MediaSection] Error subiendo media:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [items, onChange, userId]
  );

  const handleDelete = useCallback(
    async (item: MediaItem) => {
      try {
        await deleteEvolucionadorMedia(item.storagePath);
        onChange(items.filter((current) => current.id !== item.id));
      } catch (error) {
        console.error('[MediaSection] Error eliminando media:', error);
      }
    },
    [items, onChange]
  );

  const handleDescriptionChange = useCallback(
    (itemId: string, description: string) => {
      onChange(
        items.map((item) => (item.id === itemId ? { ...item, description } : item))
      );
    },
    [items, onChange]
  );

  return (
    <div className="space-y-4">
      <MediaUploader onUpload={handleUpload} isUploading={isUploading} />
      <MediaGallery items={items} onDelete={handleDelete} onDescriptionChange={handleDescriptionChange} />
    </div>
  );
};

export default MediaSection;

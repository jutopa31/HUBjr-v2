# ImageGallery Component Usage Guide

## Location
`C:\Users\julia\onedrive\documentos\proyectos\hubjr-v2\src\components\wardRounds\ImageGallery.tsx`

## Overview
Advanced image gallery component with two display modes: compact view for patient cards and grid view for detail modals. Supports drag & drop upload, image deletion, and EXA badge display.

## Props Interface

```typescript
interface ImageGalleryProps {
  images: Array<{ thumbnail: string; full: string; exa?: string | null }>;
  onImagesChange?: (images: Array<{ thumbnail: string; full: string; exa?: string | null }>) => void;
  onUpload?: (files: FileList) => Promise<void>;
  isEditable?: boolean;
  isUploading?: boolean;
  uploadProgress?: { uploaded: number; total: number };
  mode?: 'compact' | 'grid';  // default: 'grid'
}
```

## Display Modes

### 1. Compact Mode (for patient cards)
- Read-only view
- Shows first 3 images as 60x60px thumbnails
- Displays "+X más" badge if more than 3 images
- Horizontal flex layout
- Returns null if no images

```tsx
<ImageGallery
  images={patient.images}
  mode="compact"
/>
```

### 2. Grid Mode (for detail modals)
- Full-featured view with upload and delete capabilities
- 3-column responsive grid (2 cols tablet, 1 col mobile)
- 150px height images with hover effects
- Shows EXA badges
- Upload zone when editable

```tsx
<ImageGallery
  images={patient.images}
  onImagesChange={handleImagesChange}
  onUpload={handleUpload}
  isEditable={isEditMode}
  isUploading={uploading}
  uploadProgress={{ uploaded: 2, total: 5 }}
  mode="grid"
/>
```

## Usage Examples

### Example 1: Read-Only Grid View in Patient Detail Modal

```tsx
import ImageGallery from './components/wardRounds/ImageGallery';

function PatientDetailModal({ patient }) {
  return (
    <div>
      <h3>Imágenes del paciente</h3>
      <ImageGallery
        images={patient.images}
        mode="grid"
      />
    </div>
  );
}
```

### Example 2: Editable Grid with Upload

```tsx
import ImageGallery from './components/wardRounds/ImageGallery';
import { useState } from 'react';

function EditPatientImages({ patient, onSave }) {
  const [images, setImages] = useState(patient.images);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ uploaded: 0, total: 0 });

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setProgress({ uploaded: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('patient-images')
        .upload(`${patient.id}/${file.name}`, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('patient-images')
          .getPublicUrl(data.path);

        setImages(prev => [...prev, {
          thumbnail: publicUrl,
          full: publicUrl,
          exa: null
        }]);
      }

      setProgress({ uploaded: i + 1, total: files.length });
    }

    setUploading(false);
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    // Optionally save to database immediately
    onSave({ ...patient, images: newImages });
  };

  return (
    <ImageGallery
      images={images}
      onImagesChange={handleImagesChange}
      onUpload={handleUpload}
      isEditable={true}
      isUploading={uploading}
      uploadProgress={progress}
      mode="grid"
    />
  );
}
```

### Example 3: Compact View in Patient Card List

```tsx
import ImageGallery from './components/wardRounds/ImageGallery';

function PatientCard({ patient }) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{patient.name}</h3>
      <p>DNI: {patient.dni}</p>

      {/* Compact image gallery - shows only if images exist */}
      <ImageGallery
        images={patient.images}
        mode="compact"
      />
    </div>
  );
}
```

### Example 4: With Lightbox Integration

```tsx
import ImageGallery from './components/wardRounds/ImageGallery';
import { useState } from 'react';

function PatientImagesWithLightbox({ patient }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Note: You'll need to modify ImageGallery to accept onClick handler */}
      <ImageGallery
        images={patient.images}
        mode="grid"
      />

      {/* Your lightbox component */}
      {lightboxOpen && (
        <Lightbox
          images={patient.images.map(img => img.full)}
          currentIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
```

## Features

### Drag & Drop Upload
- Visual feedback when dragging over (blue border, blue background)
- Supports multiple file selection
- Only available in grid mode when `isEditable={true}`

### Image Deletion
- Hover over image to reveal delete button (trash icon)
- Only available when `isEditable={true}`
- Confirms deletion by calling `onImagesChange` with filtered array

### EXA Badge Display
- Shows "EXA" badge with external link icon
- Positioned in top-right corner of image
- Displayed when `image.exa` property exists

### Progress Tracking
- Shows "Subiendo imagen X de Y" text
- Animated progress bar
- Only displayed when `isUploading={true}` and `uploadProgress` is provided

### Responsive Design
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column
- Compact mode: always horizontal flex

### Dark Mode Support
- All colors and backgrounds support dark mode
- Uses Tailwind `dark:` variants throughout

## Image Data Structure

```typescript
interface PatientImage {
  thumbnail: string;  // URL to thumbnail version
  full: string;       // URL to full-resolution version
  exa?: string | null; // Optional URL to external exam/study
}
```

## Accessibility

- All images have descriptive `alt` text
- Buttons have `title` attributes for tooltips
- Keyboard navigation supported for file input
- Proper ARIA attributes on interactive elements

## Performance Considerations

- Uses CSS transforms for hover effects (GPU-accelerated)
- Only renders hover overlay when actively hovering
- Lazy loading can be added with `loading="lazy"` attribute
- Consider implementing virtual scrolling for 100+ images

## Styling Customization

All styles use Tailwind CSS. To customize:

1. Modify Tailwind classes directly in component
2. Add custom CSS classes via `className` prop (future enhancement)
3. Use Tailwind configuration for theme colors

## Future Enhancements

Potential additions:
- Image reordering via drag & drop
- Bulk selection and deletion
- Image cropping/rotation
- Zoom controls on hover
- Fullscreen lightbox integration
- Lazy loading for large galleries
- Image metadata display
- Download all images

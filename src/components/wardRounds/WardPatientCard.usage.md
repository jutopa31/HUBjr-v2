# WardPatientCard Component Usage Guide

## Overview
The `WardPatientCard` component displays patient information in a compact, card-based format for the Ward Rounds card view. It supports drag-and-drop functionality for reordering patients and includes visual indicators for severity, images, assigned residents, and pending tasks.

## Component Location
```
C:\Users\julia\onedrive\documentos\proyectos\hubjr-v2\src\components\wardRounds\WardPatientCard.tsx
```

## Features
- Compact card layout with severity badges
- Bed location and patient demographics
- Truncated diagnosis display (80 characters max)
- Pending tasks preview with warning indicator
- Image count badge
- Assigned resident display
- Drag-and-drop support for reordering
- Dark mode compatible
- Click handler for viewing details

## Props Interface

```typescript
interface WardPatientCardProps {
  patient: Patient;                    // Required: Patient data object
  resident?: ResidentProfile;          // Optional: Assigned resident info
  onClick: () => void;                 // Required: Handler for card click
  onDragStart?: (e: React.DragEvent, patientId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetPatientId: string) => void;
  isDragging?: boolean;                // Optional: Visual state for dragging
  isDragOver?: boolean;                // Optional: Visual state for drag-over
}
```

## Basic Usage

### Simple Card (No Drag & Drop)
```typescript
import WardPatientCard from './components/wardRounds/WardPatientCard';

function MyComponent() {
  const handlePatientClick = (patient: Patient) => {
    console.log('Patient clicked:', patient);
    // Open detail modal, navigate, etc.
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <WardPatientCard
          key={patient.id}
          patient={patient}
          resident={residents.find(r => r.id === patient.assigned_resident_id)}
          onClick={() => handlePatientClick(patient)}
        />
      ))}
    </div>
  );
}
```

### With Drag & Drop Support
```typescript
import { useState } from 'react';
import WardPatientCard from './components/wardRounds/WardPatientCard';

function WardRoundsCardView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [draggedPatientId, setDraggedPatientId] = useState<string | null>(null);
  const [dragOverPatientId, setDragOverPatientId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, patientId: string) => {
    setDraggedPatientId(patientId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (patientId: string) => {
    setDragOverPatientId(patientId);
  };

  const handleDragLeave = () => {
    setDragOverPatientId(null);
  };

  const handleDrop = (e: React.DragEvent, targetPatientId: string) => {
    e.preventDefault();

    if (!draggedPatientId || draggedPatientId === targetPatientId) {
      setDraggedPatientId(null);
      setDragOverPatientId(null);
      return;
    }

    // Reorder logic
    const draggedIndex = patients.findIndex(p => p.id === draggedPatientId);
    const targetIndex = patients.findIndex(p => p.id === targetPatientId);

    const newPatients = [...patients];
    const [removed] = newPatients.splice(draggedIndex, 1);
    newPatients.splice(targetIndex, 0, removed);

    // Update display_order for persistence
    const updatedPatients = newPatients.map((p, index) => ({
      ...p,
      display_order: index
    }));

    setPatients(updatedPatients);
    setDraggedPatientId(null);
    setDragOverPatientId(null);

    // Persist to database
    // await updatePatientOrder(updatedPatients);
  };

  const handlePatientClick = (patient: Patient) => {
    // Open detail modal
    setSelectedPatient(patient);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <WardPatientCard
          key={patient.id}
          patient={patient}
          resident={residents.find(r => r.id === patient.assigned_resident_id)}
          onClick={() => handlePatientClick(patient)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedPatientId === patient.id}
          isDragOver={dragOverPatientId === patient.id}
        />
      ))}
    </div>
  );
}
```

## Styling Details

### Severity Badges
The component uses CSS classes defined in `src/index.css`:
- **Severity I** (Mild): `badge-severity-1` - Green styling
- **Severity II** (Moderate): `badge-severity-2` - Yellow/warning styling
- **Severity III** (High): `badge-severity-3` - Orange styling
- **Severity IV** (Critical): `badge-severity-4` - Red/error styling

### Card States
- **Normal**: Border gray-200 (dark: gray-700)
- **Hover**: Border blue-300, elevated shadow
- **Dragging**: Opacity 50%, cursor changes to move
- **Drag Over**: Border blue-500, blue background tint

### Dark Mode
All colors automatically adapt to dark mode using Tailwind's `dark:` variants.

## Layout Specifications

The card displays information in the following order:
1. **Top Row**: Severity badge + Bed location
2. **Name Section**: Patient name (bold) + DNI
3. **Age**: Patient age
4. **Diagnosis**: Truncated to 80 characters
5. **Pending Tasks** (if exists): Warning icon + 40-character preview
6. **Bottom Info Bar**: Image count badge + Resident name
7. **Action Footer**: "Ver detalles →" link

## Icons Used (from lucide-react)
- `Camera` - Image count indicator
- `User` - Assigned resident indicator
- `AlertCircle` - Pending tasks warning
- `GripVertical` - Drag handle (visible on hover)
- `ChevronRight` - Detail navigation arrow

## Integration with WardRounds.tsx

To integrate into the existing WardRounds component:

```typescript
// Add import at top of WardRounds.tsx
import WardPatientCard from './components/wardRounds/WardPatientCard';

// Add view mode state
const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

// In the render section, conditionally show cards or table
{viewMode === 'cards' ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {patients.map((patient) => (
      <WardPatientCard
        key={patient.id}
        patient={patient}
        resident={residents.find(r => r.id === patient.assigned_resident_id)}
        onClick={() => handlePatientRowClick(patient)}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        isDragging={draggedPatientId === patient.id}
        isDragOver={dragOverPatientId === patient.id}
      />
    ))}
  </div>
) : (
  // Existing table view
)}
```

## Responsive Grid Layout

Recommended grid configuration:
```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
  {/* Cards */}
</div>
```

This provides:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Large screens: 4 columns

## Performance Considerations

1. **Memoization**: Consider using `React.memo()` if rendering many cards
2. **Virtualization**: For 50+ patients, consider react-window or similar
3. **Image Loading**: Images are only counted, not loaded in card view
4. **Truncation**: Long text fields are truncated to prevent layout issues

## Accessibility

- Cards are keyboard accessible (clickable)
- Drag operations include proper aria attributes
- Color contrast meets WCAG 2.1 AA standards
- Hover states provide clear visual feedback

## Future Enhancements

Potential additions:
- Filter/search integration
- Bulk selection mode
- Quick actions menu
- Expand/collapse for full diagnosis view
- Print-friendly card layout

# Ward Rounds Components

This directory contains reusable components for the Ward Rounds (Pase de Sala) feature of the Neurology Residency Hub application.

## Components

### WardPatientCard.tsx
**Purpose**: Display patient information in a compact card format for card-based views.

**Features**:
- Severity badge display (I, II, III, IV)
- Patient demographics (name, DNI, age, bed location)
- Diagnosis preview with text truncation
- Pending tasks indicator with warning badge
- Image count badge
- Assigned resident display
- Drag-and-drop support for reordering
- Click handler for detail viewing
- Full dark mode support

**Use Cases**:
- Card grid view of ward patients
- Alternative to table layout
- Mobile-friendly patient browsing
- Drag-to-reorder patient lists

**Files**:
- `WardPatientCard.tsx` - Main component
- `WardPatientCard.usage.md` - Detailed usage documentation
- `WardPatientCard.demo.tsx` - Interactive demo with sample data

### ImageGallery.tsx
**Purpose**: Display and manage patient images in the ward rounds detail view.

**Features**:
- Grid layout for multiple images
- Thumbnail preview with full-size lightbox
- Add/remove image functionality
- Upload progress tracking
- Error handling for failed uploads
- Dark mode support

**Files**:
- `ImageGallery.tsx` - Main component
- `ImageGallery.usage.md` - Usage documentation

### ImageLightbox.tsx
**Purpose**: Full-screen image viewer with navigation controls.

**Features**:
- Full-screen overlay display
- Previous/next navigation
- Close on escape key or backdrop click
- Zoom and pan support
- Keyboard navigation
- Dark mode compatible

**File**: `ImageLightbox.tsx`

## Integration with WardRounds

These components are designed to work with the main `WardRounds.tsx` component located in `src/WardRounds.tsx`.

### Example Integration

```typescript
import WardPatientCard from './components/wardRounds/WardPatientCard';
import ImageGallery from './components/wardRounds/ImageGallery';
import ImageLightbox from './components/wardRounds/ImageLightbox';

// In your WardRounds component:
function WardRounds() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  return (
    <div>
      {/* View toggle */}
      <button onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
        Toggle View
      </button>

      {/* Conditional rendering */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(patient => (
            <WardPatientCard
              key={patient.id}
              patient={patient}
              resident={residents.find(r => r.id === patient.assigned_resident_id)}
              onClick={() => handlePatientClick(patient)}
            />
          ))}
        </div>
      ) : (
        // Table view
      )}
    </div>
  );
}
```

## Styling

All components use:
- **Tailwind CSS** for utility classes
- **CSS Variables** from `src/index.css` for theming
- **medical-card** class for consistent card styling
- **badge-severity-1/2/3/4** classes for severity indicators
- Full **dark mode** support via Tailwind's `dark:` variants

## Type Definitions

Components use shared types from the parent WardRounds component:

```typescript
interface Patient {
  id?: string;
  cama: string;
  dni: string;
  nombre: string;
  edad: string;
  antecedentes: string;
  motivo_consulta: string;
  examen_fisico: string;
  estudios: string;
  severidad: string;  // I, II, III, IV
  diagnostico: string;
  plan: string;
  pendientes: string;
  fecha: string;
  image_thumbnail_url?: string[];
  image_full_url?: string[];
  assigned_resident_id?: string;
  display_order?: number;
}

interface ResidentProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}
```

## Testing

Use the demo files to test components in isolation:

```bash
# Run development server
npm run dev

# Import demo component in your test page
import WardPatientCardDemo from './components/wardRounds/WardPatientCard.demo';
```

## Accessibility

All components follow accessibility best practices:
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Color contrast meets WCAG 2.1 AA standards
- Screen reader friendly

## Performance

Components are optimized for:
- Efficient re-rendering with React.memo (when needed)
- Image lazy loading
- Text truncation to prevent layout thrashing
- Minimal DOM updates during drag operations

## Future Enhancements

Planned improvements:
- Virtualized scrolling for large patient lists
- Bulk selection mode
- Quick actions menu on cards
- Enhanced filtering and sorting
- Export to PDF in card format
- Print-friendly layouts

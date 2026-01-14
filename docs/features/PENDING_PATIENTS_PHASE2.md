# Pending Patients - Phase 2: Supabase Integration

## Overview
This document explains how to integrate the Pending Patients feature with Supabase, replacing mock data with real database operations.

## Prerequisites
- Phase 1 (Frontend) completed ✅
- Supabase project set up and configured
- Admin access to Supabase SQL Editor

---

## Step 1: Create Database Table

### 1.1 Execute SQL Script
1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire content from `database/setup_pending_patients.sql`
5. Click **Run**

### 1.2 Verify Table Creation
Run this verification query:
```sql
SELECT * FROM pending_patients LIMIT 5;
```

### 1.3 Verify RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'pending_patients';
```

You should see 4 policies:
- `Users can view accessible pending patients` (SELECT)
- `Authenticated users can create pending patients` (INSERT)
- `Users can update their own pending patients` (UPDATE)
- `Users can delete their own pending patients` (DELETE)

---

## Step 2: Update PendingPatientsBoard Component

Replace the mock data logic in `src/PendingPatientsBoard.tsx`:

### 2.1 Add Service Import
```typescript
import * as pendingPatientsService from './services/pendingPatientsService';
```

### 2.2 Replace `loadMockData()` with Real Fetch
```typescript
const loadPatients = async () => {
  setLoading(true);
  const { data, error } = await pendingPatientsService.fetchPendingPatients(
    hospitalContext,
    showResolved
  );

  if (!error && data) {
    setPatients(data);
  } else {
    console.error('Error loading patients:', error);
  }
  setLoading(false);
};

useEffect(() => {
  loadPatients();
}, [hospitalContext, showResolved]);
```

### 2.3 Replace `handleCreatePatient()`
```typescript
const handleCreatePatient = async (data: CreatePendingPatientInput) => {
  const { data: newPatient, error } = await pendingPatientsService.createPendingPatient(
    data,
    user?.email || ''
  );

  if (!error && newPatient) {
    setPatients([...patients, newPatient]);
  } else {
    console.error('Error creating patient:', error);
    // TODO: Show error toast to user
  }
};
```

### 2.4 Replace `handleUpdatePatient()`
```typescript
const handleUpdatePatient = async (data: CreatePendingPatientInput) => {
  if (!editingPatient) return;

  const { data: updatedPatient, error } = await pendingPatientsService.updatePendingPatient(
    editingPatient.id,
    data
  );

  if (!error && updatedPatient) {
    setPatients(patients.map(p =>
      p.id === editingPatient.id ? updatedPatient : p
    ));
    setEditingPatient(null);
  } else {
    console.error('Error updating patient:', error);
    // TODO: Show error toast to user
  }
};
```

### 2.5 Replace `handleDeletePatient()`
```typescript
const handleDeletePatient = async (id: string) => {
  const { success, error } = await pendingPatientsService.deletePendingPatient(id);

  if (success) {
    setPatients(patients.filter(p => p.id !== id));
  } else {
    console.error('Error deleting patient:', error);
    // TODO: Show error toast to user
  }
};
```

### 2.6 Replace `handleResolvePatient()`
```typescript
const handleResolvePatient = async (id: string, finalDiagnosis: string) => {
  const { data: resolvedPatient, error } = await pendingPatientsService.resolvePendingPatient(
    id,
    finalDiagnosis
  );

  if (!error && resolvedPatient) {
    setPatients(patients.map(p =>
      p.id === id ? resolvedPatient : p
    ));
  } else {
    console.error('Error resolving patient:', error);
    // TODO: Show error toast to user
  }
};
```

### 2.7 Replace `handleColorChange()`
```typescript
const handleColorChange = async (id: string, color: CardColor) => {
  const { data: updatedPatient, error } = await pendingPatientsService.changePatientColor(
    id,
    color
  );

  if (!error && updatedPatient) {
    setPatients(patients.map(p =>
      p.id === id ? updatedPatient : p
    ));
  } else {
    console.error('Error changing color:', error);
    // TODO: Show error toast to user
  }
};
```

### 2.8 Re-enable Loading State
```typescript
// At the top with other state declarations
const [loading, setLoading] = useState(false);

// In the render section
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 dark:text-gray-400">Cargando pacientes...</div>
    </div>
  );
}
```

---

## Step 3: Test the Integration

### 3.1 Test Create
1. Click "Nuevo Paciente"
2. Fill in the form
3. Click "Crear paciente"
4. Verify patient appears in the grid
5. Check Supabase table to confirm data was saved

### 3.2 Test Update
1. Hover over a patient card
2. Click the edit (pencil) icon
3. Modify fields
4. Click "Guardar cambios"
5. Verify changes appear immediately

### 3.3 Test Delete
1. Hover over a patient card
2. Click the delete (trash) icon
3. Confirm deletion
4. Verify patient is removed from grid

### 3.4 Test Resolve
1. Hover over a patient card
2. Click the resolve (checkmark) icon
3. Enter final diagnosis
4. Click "Confirmar"
5. Verify patient shows as resolved with badge

### 3.5 Test Color Change
1. Hover over a patient card
2. Click the color palette icon
3. Select a new color
4. Verify color changes immediately

### 3.6 Test Filters
1. Search by patient name
2. Filter by priority
3. Toggle "Mostrar resueltos"
4. Verify results update correctly

### 3.7 Test Hospital Context
1. Enable admin mode
2. Switch between Posadas and Julian
3. Verify only relevant patients show
4. Try creating patients in each context

---

## Step 4: Error Handling & UX Improvements

### 4.1 Add Toast Notifications
Install a toast library if not already present:
```bash
npm install react-hot-toast
```

Add to component:
```typescript
import toast from 'react-hot-toast';

// In error handlers:
toast.error('Error al crear paciente');
toast.success('Paciente creado exitosamente');
```

### 4.2 Add Loading States
```typescript
// For individual operations
const [savingPatient, setSavingPatient] = useState(false);

// In the create handler:
setSavingPatient(true);
const result = await pendingPatientsService.createPendingPatient(data, userEmail);
setSavingPatient(false);
```

### 4.3 Add Optimistic Updates
For better UX, update the UI immediately and revert on error:
```typescript
// Optimistic delete example
setPatients(patients.filter(p => p.id !== id));
const { success, error } = await pendingPatientsService.deletePendingPatient(id);
if (error) {
  // Revert on error
  loadPatients();
  toast.error('Error al eliminar paciente');
}
```

---

## Step 5: Optional Enhancements

### 5.1 Real-time Updates
Add Supabase real-time subscriptions to see changes from other users:
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('pending-patients-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pending_patients',
        filter: `hospital_context=eq.${hospitalContext}`
      },
      (payload) => {
        console.log('Change received!', payload);
        loadPatients(); // Refresh the list
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [hospitalContext]);
```

### 5.2 Advanced Search
Implement full-text search using the service function:
```typescript
const handleSearch = async (query: string) => {
  if (!query.trim()) {
    loadPatients();
    return;
  }

  const { data, error } = await pendingPatientsService.searchPendingPatients(
    hospitalContext,
    query
  );

  if (!error && data) {
    setPatients(data);
  }
};
```

### 5.3 Statistics Dashboard
Add a stats card at the top using the stats service:
```typescript
const [stats, setStats] = useState(null);

useEffect(() => {
  const loadStats = async () => {
    const { data } = await pendingPatientsService.getPendingPatientsStats(hospitalContext);
    if (data) setStats(data);
  };
  loadStats();
}, [hospitalContext, patients]);

// Render stats
{stats && (
  <div className="grid grid-cols-4 gap-4 mb-4">
    <StatCard label="Total" value={stats.total} />
    <StatCard label="Pendientes" value={stats.pending} color="yellow" />
    <StatCard label="Urgentes" value={stats.urgent} color="red" />
    <StatCard label="Resueltos" value={stats.resolved} color="green" />
  </div>
)}
```

---

## Troubleshooting

### Common Issues

**Issue: "relation 'pending_patients' does not exist"**
- Solution: Execute the SQL script in Supabase SQL Editor

**Issue: "new row violates row-level security policy"**
- Solution: Verify RLS policies are correctly set up
- Check that `created_by` matches the authenticated user's email

**Issue: "permission denied for table pending_patients"**
- Solution: Verify the user is authenticated
- Check that `admin_privileges` table exists if testing with Julian context

**Issue: Changes not appearing in UI**
- Solution: Check browser console for errors
- Verify `loadPatients()` is being called after operations
- Check that filters aren't hiding the new data

---

## Performance Considerations

1. **Pagination**: For large datasets (>100 patients), implement pagination:
   ```typescript
   const PAGE_SIZE = 20;
   // Use .range(from, to) in Supabase query
   ```

2. **Debounced Search**: Prevent excessive queries on search:
   ```typescript
   import { debounce } from 'lodash';
   const debouncedSearch = debounce(handleSearch, 300);
   ```

3. **Lazy Loading**: Load resolved patients only when needed

---

## Security Checklist

- ✅ RLS policies are enabled on `pending_patients` table
- ✅ Users can only see patients in accessible hospital contexts
- ✅ Users can only modify their own patients (or admins can modify all)
- ✅ `created_by` is automatically set server-side (via policy)
- ✅ Hospital context access is validated via `admin_privileges` table
- ✅ All queries have timeout protection (12 seconds)

---

## Rollback Instructions

If you need to roll back to Phase 1 (mock data):

1. Keep the SQL table (data is preserved)
2. Revert `PendingPatientsBoard.tsx` to use mock data
3. Comment out service imports
4. The feature will continue working with local state

To completely remove:
```sql
DROP TABLE pending_patients CASCADE;
```

---

## Next Steps After Phase 2

1. **Integration with Evolucionador**: Allow creating ward round patients from resolved pending patients
2. **Export functionality**: Export to CSV/PDF for reporting
3. **Notifications**: Alert users when pending tests come back
4. **Mobile app**: Optimize for mobile viewing
5. **Analytics**: Track resolution times, most common diagnoses, etc.

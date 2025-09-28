# Hospital Context System Documentation

## 🏥 Overview

The Hospital Context System provides secure data separation between different medical institutions within the HubJR v2 platform, allowing authorized users to manage patients from multiple hospitals while maintaining strict data privacy and security.

## 🎯 Purpose

Originally, the system displayed "Consultorios Julian" patients to all users, creating a security vulnerability. The new system implements:

- **Secure Data Separation**: Hospital Posadas and Consultorios Julian data are properly isolated
- **Privilege-Based Access**: Only authorized users can access multiple hospital contexts
- **Context-Aware Operations**: All patient operations respect the selected hospital context
- **Audit Trail**: Complete logging of context switches and data access

## 🏗️ Architecture

### Hospital Contexts

1. **Hospital Posadas** (Default)
   - Public hospital context
   - Available to all users by default
   - Contains general patient population data

2. **Consultorios Julian** (Privileged)
   - Private consultation context
   - Only accessible to users with `hospital_context_access` or `full_admin` privileges
   - Contains private consultation patients

### User Access Levels

#### Standard Users
- **Default Context**: Hospital Posadas only
- **No Context Switching**: Hospital context selector hidden
- **Limited Access**: Cannot see or save patients in Julian context

#### Privileged Users (`julian.martin.alonso@gmail.com`)
- **Multi-Context Access**: Can switch between Posadas and Julian
- **Hospital Context Selector**: Visible in all relevant interfaces
- **Full Access**: Can view, save, and manage patients in both contexts
- **Visual Indicators**: Privilege status displayed with descriptive text

## 🔧 Implementation Details

### Components

#### 1. HospitalContextSelector (`src/HospitalContextSelector.tsx`)
```typescript
interface HospitalContextSelectorProps {
  currentContext: HospitalContext;
  onContextChange: (context: HospitalContext) => void;
  isAdminMode: boolean;
}
```

**Features:**
- Privilege-based visibility
- Visual context indicators
- Descriptive privilege status messages
- Secure context switching

#### 2. Global Context Management (`src/neurology_residency_hub.tsx`)
```typescript
const [currentHospitalContext, setCurrentHospitalContext] = useState<HospitalContext>('Posadas');
```

**Integration Points:**
- DiagnosticAlgorithmContent (main and default cases)
- Context propagation to all child components
- State management at application level

#### 3. SavePatientModal Integration (`src/SavePatientModal.tsx`)
```typescript
const canAccessHospitalSelector = hasPrivilege('full_admin') || hasHospitalContextAccess || isAdminMode;
```

**Features:**
- Dynamic hospital context selection
- Privilege validation
- Context-aware patient saving
- Descriptive privilege indicators

### Database Integration

#### Patient Data Filtering
```sql
-- Example of context-aware patient query
SELECT * FROM patient_assessments
WHERE hospital_context = current_context
AND (user_has_access OR context = 'Posadas');
```

#### Privilege Checking
```sql
-- Check if user has hospital context access
SELECT has_admin_privilege(user_email, 'hospital_context_access');
```

## 🔒 Security Features

### Privilege Validation
- **Database Level**: RLS policies enforce context separation
- **Application Level**: UI components check privileges before rendering
- **API Level**: Backend functions validate user access

### Data Isolation
- **Context Filtering**: All queries respect hospital context
- **Secure Defaults**: Non-privileged users default to Posadas context
- **No Cross-Context Leakage**: Julian data never visible to unauthorized users

### Audit Trail
- **Context Switches**: Logged through admin privilege audit system
- **Access Attempts**: Failed privilege checks are logged
- **Data Operations**: All patient operations include context information

## 🎨 User Interface

### Visual Indicators

#### Privileged Users
- **Green Badge**: Hospital context selector with green styling
- **Descriptive Text**:
  - "Acceso de administrador completo" (full_admin)
  - "Acceso autorizado a contextos hospitalarios" (hospital_context_access)
- **Context Options**: Both Posadas and Julian available

#### Standard Users
- **Hidden Selector**: No hospital context selector visible
- **Default Context**: Automatically set to Posadas
- **No Visual Indicators**: Clean interface without privilege references

### Context Selector Appearance
```tsx
<select className="bg-blue-100 text-blue-800 border-blue-200"> // Posadas
<select className="bg-green-100 text-green-800 border-green-200"> // Julian
```

## 🔄 Workflow

### Privileged User Workflow
1. **Login**: Automatic privilege detection
2. **Context Selection**: Hospital context selector appears
3. **Context Switch**: Select desired hospital (Posadas/Julian)
4. **Patient Operations**: All operations use selected context
5. **Data Viewing**: See context-appropriate patient lists

### Standard User Workflow
1. **Login**: Standard authentication
2. **Default Context**: Automatically set to Posadas
3. **Limited Operations**: Only Posadas patients accessible
4. **No Context UI**: Hospital selector remains hidden

## 📍 Integration Points

### 1. Diagnostic Algorithm (Evolucionador)
- **Location**: Main diagnostic interface
- **Context Selector**: Appears at top of interface for privileged users
- **Saving**: Respects selected hospital context when saving patients

### 2. Saved Patients Section
- **Location**: Pacientes Guardados section
- **Context Filtering**: Shows patients from selected hospital context
- **Management**: Context-aware patient operations

### 3. Admin Functions
- **Location**: Admin authentication modal
- **Privilege Display**: Shows user's privilege status
- **Context Operations**: Admin functions respect hospital context

## 🛠️ Configuration

### Environment Variables
```bash
# Required for proper client-side context management
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Database Setup
```sql
-- Execute in Supabase SQL Editor
-- File: setup_admin_privileges.sql
```

**Grants hospital context access to julian.martin.alonso@gmail.com:**
- `hospital_context_access` privilege
- `full_admin` privilege
- Access to both Posadas and Julian contexts

## 🧪 Testing

### Test Cases

#### Privileged User Testing
1. Login as `julian.martin.alonso@gmail.com`
2. Verify hospital context selector appears in diagnostic interface
3. Switch between Posadas and Julian contexts
4. Save patients in both contexts
5. Verify context-specific patient lists

#### Standard User Testing
1. Login as any other user
2. Verify no hospital context selector appears
3. Confirm only Posadas patients are visible
4. Attempt to access Julian context (should fail gracefully)
5. Verify standard authentication still works

#### Cross-Context Data Isolation
1. Save patient in Julian context as privileged user
2. Login as standard user
3. Verify Julian patient is not visible
4. Confirm Posadas patients remain accessible

## 🚨 Troubleshooting

### Common Issues

#### Context Selector Not Appearing
- **Check**: User has required privileges in database
- **Verify**: `setup_admin_privileges.sql` has been executed
- **Confirm**: User email matches privilege records

#### Patients Not Filtering Correctly
- **Check**: Hospital context is properly propagated through components
- **Verify**: Database queries include context filtering
- **Confirm**: RLS policies are active and correctly configured

#### Environment Variable Issues
- **Check**: NEXT_PUBLIC variables are set in .env
- **Verify**: Development server has been restarted after env changes
- **Confirm**: Client-side components can access environment variables

## 📊 Benefits

### Security Benefits
- **Data Isolation**: Complete separation between hospital contexts
- **Privilege-Based Access**: Database-level security enforcement
- **Audit Trail**: Complete logging of access and operations

### User Experience Benefits
- **Seamless Switching**: Authorized users can easily switch contexts
- **Clean Interface**: Non-privileged users see simplified interface
- **Visual Feedback**: Clear indicators of current context and privileges

### Administrative Benefits
- **Centralized Management**: Single interface for multiple hospitals
- **Scalable**: Easy to add new hospital contexts
- **Secure**: Database-level enforcement prevents privilege escalation

## 🔮 Future Enhancements

### Planned Features
1. **Additional Hospital Contexts**: Support for more hospitals beyond Posadas and Julian
2. **Role-Based Access**: More granular permissions per hospital context
3. **Context-Specific Settings**: Hospital-specific configuration options
4. **Enhanced Analytics**: Context-aware reporting and statistics

### Technical Improvements
1. **Caching**: Context-aware caching for improved performance
2. **Real-time Updates**: Live context synchronization across sessions
3. **Mobile Optimization**: Enhanced mobile interface for context switching
4. **API Extensions**: RESTful API for context management

---

**Last Updated**: November 2024
**Version**: 2.0
**Status**: ✅ Production Ready
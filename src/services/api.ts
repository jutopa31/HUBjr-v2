// API service utilities for frontend
// Centralized API calls for the neurology residency hub

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://hubjr-neurology.vercel.app/api'
  : 'http://localhost:3000/api';

// Generic API call function
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Patient API functions
export const patientAPI = {
  // Get all patients
  getAll: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return apiCall(`/patients${query ? `?${query}` : ''}`);
  },

  // Get specific patient
  getById: (id: string) => apiCall(`/patients?id=${id}`),

  // Create new patient
  create: (patientData: any) => apiCall('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  }),

  // Update patient
  update: (id: string, patientData: any) => apiCall(`/patients?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(patientData),
  }),

  // Delete patient
  delete: (id: string) => apiCall(`/patients?id=${id}`, {
    method: 'DELETE',
  }),
};

// Assessment API functions  
export const assessmentAPI = {
  // Get all assessments
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    patientId?: string;
    scaleType?: string;
    residentId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });
    
    const query = searchParams.toString();
    return apiCall(`/assessments${query ? `?${query}` : ''}`);
  },

  // Get assessments for specific patient
  getByPatient: (patientId: string) => apiCall(`/assessments?patientId=${patientId}`),

  // Get specific assessment
  getById: (id: string) => apiCall(`/assessments?id=${id}`),

  // Create new assessment
  create: (assessmentData: {
    patientId: string;
    scaleType: string;
    results: any;
    performedBy?: string;
    notes?: string;
    interpretation?: string;
  }) => apiCall('/assessments', {
    method: 'POST',
    body: JSON.stringify(assessmentData),
  }),

  // Update assessment
  update: (id: string, assessmentData: any) => apiCall(`/assessments?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(assessmentData),
  }),

  // Delete assessment
  delete: (id: string) => apiCall(`/assessments?id=${id}`, {
    method: 'DELETE',
  }),
};

// Resident API functions
export const residentAPI = {
  // Get all residents
  getAll: (params?: { year?: string; department?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.year) searchParams.append('year', params.year);
    if (params?.department) searchParams.append('department', params.department);
    
    const query = searchParams.toString();
    return apiCall(`/residents${query ? `?${query}` : ''}`);
  },

  // Get specific resident
  getById: (id: string) => apiCall(`/residents?id=${id}`),

  // Create new resident
  create: (residentData: {
    firstName: string;
    lastName: string;
    email: string;
    year?: string;
    specialization?: string;
    department?: string;
    role?: string;
    permissions?: string[];
  }) => apiCall('/residents', {
    method: 'POST',
    body: JSON.stringify(residentData),
  }),

  // Update resident
  update: (id: string, residentData: any) => apiCall(`/residents?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(residentData),
  }),

  // Deactivate resident
  delete: (id: string) => apiCall(`/residents?id=${id}`, {
    method: 'DELETE',
  }),
};

// Calendar API functions
export const calendarAPI = {
  // Get all events
  getAll: (params?: {
    residentId?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
    category?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    
    const query = searchParams.toString();
    return apiCall(`/calendar${query ? `?${query}` : ''}`);
  },

  // Get specific event
  getById: (id: string) => apiCall(`/calendar?id=${id}`),

  // Create new event
  create: (eventData: {
    title: string;
    startDate: string;
    endDate: string;
    type?: string;
    category?: string;
    location?: string;
    description?: string;
    attendees?: string[];
    isRecurring?: boolean;
    recurrencePattern?: string;
  }) => apiCall('/calendar', {
    method: 'POST',
    body: JSON.stringify(eventData),
  }),

  // Update event
  update: (id: string, eventData: any) => apiCall(`/calendar?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  }),

  // Delete event
  delete: (id: string) => apiCall(`/calendar?id=${id}`, {
    method: 'DELETE',
  }),
};

// Utility functions for common operations
export const apiUtils = {
  // Save assessment result
  saveAssessment: async (assessmentData: {
    patientId?: string;
    patientName?: string;
    scaleType: string;
    results: any;
    score?: number;
    interpretation?: string;
    notes?: string;
    performedBy?: string;
  }) => {
    try {
      // If no patientId provided, create a new patient or use guest mode
      let patientId = assessmentData.patientId;
      
      if (!patientId && assessmentData.patientName) {
        const [firstName, ...lastNameParts] = assessmentData.patientName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        const newPatient: any = await patientAPI.create({
          firstName,
          lastName: lastName || 'Unknown',
          isGuest: true,
        });
        
        patientId = newPatient.patient.id;
      }
      
      // Create the assessment
      const assessment = await assessmentAPI.create({
        patientId: patientId || 'guest',
        scaleType: assessmentData.scaleType,
        results: assessmentData.results,
        interpretation: assessmentData.interpretation,
        notes: assessmentData.notes,
        performedBy: assessmentData.performedBy || 'unknown',
      });
      
      return assessment;
    } catch (error) {
      console.error('Failed to save assessment:', error);
      throw error;
    }
  },

  // Get patient history
  getPatientHistory: async (patientId: string) => {
    try {
      const [patient, assessments]: [any, any] = await Promise.all([
        patientAPI.getById(patientId),
        assessmentAPI.getByPatient(patientId)
      ]);
      
      return {
        patient,
        assessments: assessments.assessments || []
      };
    } catch (error) {
      console.error('Failed to get patient history:', error);
      throw error;
    }
  },

  // Get resident dashboard data
  getResidentDashboard: async (residentId: string) => {
    try {
      const [resident, recentAssessments, upcomingEvents]: [any, any, any] = await Promise.all([
        residentAPI.getById(residentId),
        assessmentAPI.getAll({ 
          residentId, 
          limit: 10,
          // Get assessments from last 30 days
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }),
        calendarAPI.getAll({
          residentId,
          startDate: new Date().toISOString(),
          // Get events for next 7 days
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      ]);
      
      return {
        resident,
        recentAssessments: recentAssessments.assessments || [],
        upcomingEvents: upcomingEvents.events || []
      };
    } catch (error) {
      console.error('Failed to get resident dashboard data:', error);
      throw error;
    }
  }
};

export default {
  patientAPI,
  assessmentAPI,
  residentAPI,
  calendarAPI,
  apiUtils
};
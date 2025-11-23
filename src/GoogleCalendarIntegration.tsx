import React, { useState, useEffect } from 'react';
import { Calendar, Link, Unlink, CheckCircle, AlertCircle, Loader } from 'lucide-react';

declare global {
  interface Window {
    gapi: any;
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'clinical' | 'theory' | 'workshop' | 'research' | 'administrative';
  description?: string;
  presenter?: string;
  location?: string;
  duration?: string;
}

interface GoogleCalendarIntegrationProps {
  events: CalendarEvent[];
  onEventSync?: (event: CalendarEvent) => void;
  onImportEvents?: (events: CalendarEvent[]) => void;
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({
  events,
  onEventSync,
  onImportEvents
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Google Calendar API configuration
  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-client-id';
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'your-api-key';
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

  useEffect(() => {
    initializeGapi();
  }, []);

  const initializeGapi = async () => {
    try {
      if (typeof window.gapi === 'undefined') {
        // Load Google API script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = loadGapi;
        document.head.appendChild(script);
      } else {
        await loadGapi();
      }
    } catch (error) {
      console.error('Error initializing Google API:', error);
      setError('Failed to initialize Google Calendar API');
    }
  };

  const loadGapi = async () => {
    await new Promise((resolve) => {
      window.gapi.load('client:auth2', resolve);
    });

    await window.gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: [DISCOVERY_DOC],
      scope: SCOPES
    });

    const authInstance = window.gapi.auth2.getAuthInstance();
    setIsAuthenticated(authInstance.isSignedIn.get());
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Failed to sign in to Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToGoogleEvent = (event: CalendarEvent) => {
    const startDateTime = new Date(`${event.date}T${event.time}:00`);
    const endDateTime = new Date(startDateTime);
    
    // Default duration of 1 hour if not specified
    if (event.duration) {
      const duration = parseInt(event.duration.match(/\d+/)?.[0] || '60');
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);
    } else {
      endDateTime.setHours(endDateTime.getHours() + 1);
    }

    return {
      summary: event.title,
      description: `${event.description || ''}\n\nPresentador: ${event.presenter || 'N/A'}\nTipo: ${event.type}`,
      location: event.location || 'Hospital Nacional Posadas',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires'
      },
      colorId: getColorId(event.type)
    };
  };

  const getColorId = (type: CalendarEvent['type']): string => {
    const colorMap = {
      clinical: '11', // Red
      theory: '9',    // Blue
      workshop: '10', // Green
      research: '6',  // Orange
      administrative: '8' // Gray
    };
    return colorMap[type] || '1';
  };

  const syncEventToGoogle = async (event: CalendarEvent) => {
    if (!isAuthenticated) {
      setError('Please sign in to Google Calendar first');
      return;
    }

    setSyncStatus('syncing');
    
    try {
      const googleEvent = convertToGoogleEvent(event);
      
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });

      if (response.status === 200) {
        setSyncStatus('success');
        onEventSync?.(event);
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error syncing event:', error);
      setSyncStatus('error');
      setError('Failed to sync event to Google Calendar');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const syncAllEvents = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to Google Calendar first');
      return;
    }

    setSyncStatus('syncing');
    
    try {
      for (const event of events) {
        await syncEventToGoogle(event);
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Error syncing all events:', error);
      setSyncStatus('error');
      setError('Failed to sync all events');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const importFromGoogle = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to Google Calendar first');
      return;
    }

    setIsLoading(true);
    
    try {
      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: oneMonthLater.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const googleEvents = response.result.items || [];
      const importedEvents: CalendarEvent[] = googleEvents
        .filter((event: any) => event.summary && event.start)
        .map((event: any, index: number) => ({
          id: `google-${event.id || index}`,
          title: event.summary,
          date: event.start.dateTime ? event.start.dateTime.split('T')[0] : event.start.date,
          time: event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : '00:00',
          type: 'administrative' as const,
          description: event.description || '',
          location: event.location || '',
          duration: '60 minutos'
        }));

      onImportEvents?.(importedEvents);
    } catch (error) {
      console.error('Error importing events:', error);
      setError('Failed to import events from Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Google Calendar Integration</h3>
        </div>
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-2 text-gray-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Connected</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-500">
            <Unlink className="h-4 w-4" />
            <span className="text-sm">Not connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-700" />
            <span className="text-sm text-gray-800">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {!isAuthenticated ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to sync events and import your schedule.
            </p>
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Link className="h-4 w-4 mr-2" />
              )}
              Connect Google Calendar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={syncAllEvents}
                disabled={syncStatus === 'syncing'}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {syncStatus === 'syncing' ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : syncStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'success' ? 'Synced!' : 'Sync All Events'}
              </button>

              <button
                onClick={importFromGoogle}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {isLoading ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Import Events
              </button>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Sync Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Events will be created in your primary Google Calendar</li>
                <li>• Colors will match event types (red=clinical, blue=theory, etc.)</li>
                <li>• Location will default to Hospital Nacional Posadas</li>
                <li>• Import will fetch events from the next 30 days</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarIntegration;

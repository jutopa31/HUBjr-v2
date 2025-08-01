// API endpoint for academic calendar and events
// Handles rotations, conferences, and academic activities

import { cors, runMiddleware } from '../src/utils/cors.js';

// In-memory storage (replace with database in production)
let events = [
  {
    id: 'evt_morning_rounds',
    title: 'Morning Rounds',
    type: 'clinical',
    category: 'rounds',
    startDate: '2025-08-01T08:00:00.000Z',
    endDate: '2025-08-01T10:00:00.000Z',
    location: 'Neurology Ward',
    description: 'Daily morning patient rounds',
    attendees: ['res_chief_julian'],
    isRecurring: true,
    recurrencePattern: 'daily',
    createdBy: 'res_chief_julian',
    createdAt: '2025-07-01T00:00:00.000Z'
  }
];

let rotationSchedule = [];

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.id) {
          // Get specific event
          const event = events.find(e => e.id === query.id);
          if (!event) {
            return res.status(404).json({ error: 'Event not found' });
          }
          return res.status(200).json(event);
        } else {
          // Get events with filtering
          let filteredEvents = events;
          
          // Filter by resident
          if (query.residentId) {
            filteredEvents = filteredEvents.filter(
              e => e.attendees.includes(query.residentId) || e.createdBy === query.residentId
            );
          }
          
          // Filter by date range
          if (query.startDate && query.endDate) {
            const start = new Date(query.startDate);
            const end = new Date(query.endDate);
            
            filteredEvents = filteredEvents.filter(e => {
              const eventStart = new Date(e.startDate);
              const eventEnd = new Date(e.endDate);
              
              return (eventStart >= start && eventStart <= end) ||
                     (eventEnd >= start && eventEnd <= end) ||
                     (eventStart <= start && eventEnd >= end);
            });
          }
          
          // Filter by type
          if (query.type) {
            filteredEvents = filteredEvents.filter(e => e.type === query.type);
          }
          
          // Filter by category
          if (query.category) {
            filteredEvents = filteredEvents.filter(e => e.category === query.category);
          }
          
          // Sort by start date
          filteredEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
          
          return res.status(200).json({
            events: filteredEvents,
            total: filteredEvents.length,
            summary: {
              clinical: filteredEvents.filter(e => e.type === 'clinical').length,
              academic: filteredEvents.filter(e => e.type === 'academic').length,
              administrative: filteredEvents.filter(e => e.type === 'administrative').length,
              social: filteredEvents.filter(e => e.type === 'social').length
            }
          });
        }

      case 'POST':
        // Create new event
        const newEvent = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attendees: body.attendees || []
        };

        // Validate required fields
        if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) {
          return res.status(400).json({ 
            error: 'Title, start date, and end date are required' 
          });
        }

        // Validate dates
        const startDate = new Date(newEvent.startDate);
        const endDate = new Date(newEvent.endDate);
        
        if (startDate >= endDate) {
          return res.status(400).json({ 
            error: 'End date must be after start date' 
          });
        }

        // Validate event type
        const validTypes = ['clinical', 'academic', 'administrative', 'social', 'emergency'];
        if (newEvent.type && !validTypes.includes(newEvent.type)) {
          return res.status(400).json({ 
            error: `Invalid event type. Must be one of: ${validTypes.join(', ')}` 
          });
        }

        events.push(newEvent);
        
        return res.status(201).json({
          message: 'Event created successfully',
          event: newEvent
        });

      case 'PUT':
        // Update existing event
        if (!query.id) {
          return res.status(400).json({ error: 'Event ID is required' });
        }

        const eventIndex = events.findIndex(e => e.id === query.id);
        if (eventIndex === -1) {
          return res.status(404).json({ error: 'Event not found' });
        }

        // Validate dates if provided
        if (body.startDate && body.endDate) {
          const startDate = new Date(body.startDate);
          const endDate = new Date(body.endDate);
          
          if (startDate >= endDate) {
            return res.status(400).json({ 
              error: 'End date must be after start date' 
            });
          }
        }

        const updatedEvent = {
          ...events[eventIndex],
          ...body,
          updatedAt: new Date().toISOString()
        };

        events[eventIndex] = updatedEvent;

        return res.status(200).json({
          message: 'Event updated successfully',
          event: updatedEvent
        });

      case 'DELETE':
        // Delete event
        if (!query.id) {
          return res.status(400).json({ error: 'Event ID is required' });
        }

        const deleteIndex = events.findIndex(e => e.id === query.id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Event not found' });
        }

        events.splice(deleteIndex, 1);

        return res.status(200).json({
          message: 'Event deleted successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
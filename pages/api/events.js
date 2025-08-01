// API endpoint for medical events management
// Handles creating and retrieving medical events with basic validation

let events = [
  {
    id: 'evt_sample_1',
    title: 'Morning Rounds - Neurology Ward',
    link: 'https://hospital.gov.ar/neurology/rounds',
    category: 'Clinical',
    createdAt: '2025-08-01T08:00:00.000Z'
  },
  {
    id: 'evt_sample_2', 
    title: 'NIHSS Training Session',
    link: 'https://training.hospital.gov.ar/nihss',
    category: 'Education',
    createdAt: '2025-08-01T10:00:00.000Z'
  }
]; // In-memory storage (replace with database in production)

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { title, link, category } = req.body;

      // Validate required fields
      if (!title || !link) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Title and link are required' 
        });
      }

      // Validate URL format
      try {
        new URL(link);
      } catch (e) {
        return res.status(400).json({ 
          error: 'Invalid URL format',
          message: 'Please provide a valid URL for the link' 
        });
      }

      // Create new event
      const event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        link: link.trim(),
        category: category?.trim() || 'General',
        createdAt: new Date().toISOString()
      };

      events.push(event);
      
      return res.status(201).json({ 
        success: true, 
        event,
        message: 'Event created successfully'
      });
    }

    if (req.method === 'GET') {
      // Get query parameters for filtering
      const { category, limit } = req.query;
      
      let filteredEvents = events;
      
      // Filter by category if specified
      if (category && category !== 'all') {
        filteredEvents = events.filter(e => 
          e.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Limit results if specified
      if (limit) {
        const limitNum = parseInt(limit);
        if (!isNaN(limitNum) && limitNum > 0) {
          filteredEvents = filteredEvents.slice(0, limitNum);
        }
      }
      
      // Sort by creation date (newest first)
      filteredEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return res.status(200).json({ 
        events: filteredEvents,
        total: events.length,
        filtered: filteredEvents.length,
        categories: [...new Set(events.map(e => e.category))]
      });
    }

    // Method not allowed
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: `Method ${req.method} is not supported. Use GET or POST.`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
}
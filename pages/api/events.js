// API endpoint for medical events management
// Handles creating and retrieving medical events with Supabase integration

import { supabase } from '../../src/utils/supabase.js';

export default async function handler(req, res) {
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

      // Create new event in Supabase
      const eventData = {
        title: title.trim(),
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 3600000).toISOString(), // +1 hour
        type: 'clinical',
        category: category?.trim() || 'General',
        location: link.trim(),
        description: `Event: ${title.trim()}`,
        created_by: 'res_chief_julian'
      };

      const { data, error } = await supabase
        .from('medical_events')
        .insert([eventData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          error: 'Database Error',
          message: 'Failed to create event in database'
        });
      }

      return res.status(201).json({ 
        success: true, 
        event: data[0],
        message: 'Event created successfully'
      });
    }

    if (req.method === 'GET') {
      // Get query parameters for filtering
      const { category, limit } = req.query;
      
      let query = supabase
        .from('medical_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by category if specified
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      // Limit results if specified
      if (limit) {
        const limitNum = parseInt(limit);
        if (!isNaN(limitNum) && limitNum > 0) {
          query = query.limit(limitNum);
        }
      }
      
      const { data: events, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          error: 'Database Error',
          message: 'Failed to retrieve events from database'
        });
      }

      // Get total count
      const { count } = await supabase
        .from('medical_events')
        .select('*', { count: 'exact', head: true });
      
      return res.status(200).json({ 
        events: events || [],
        total: count || 0,
        filtered: events?.length || 0,
        categories: [...new Set((events || []).map(e => e.category))]
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
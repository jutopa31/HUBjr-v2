// API endpoint for resident management
// Handles resident profiles, rotations, and academic progress

import { cors, runMiddleware } from '../src/utils/cors.js';

// In-memory storage (replace with database in production)
let residents = [
  {
    id: 'res_chief_julian',
    firstName: 'Julián',
    lastName: 'Alonso',
    email: 'julian.alonso@hospital.gov.ar',
    role: 'chief_resident',
    year: 'R4',
    specialization: 'Neurology',
    department: 'Neurología',
    hospital: 'Hospital Nacional Posadas',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-08-01T00:00:00.000Z',
    isActive: true,
    permissions: ['admin', 'write', 'read', 'delete']
  }
];

let rotations = [];
let academicProgress = [];

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.id) {
          // Get specific resident
          const resident = residents.find(r => r.id === query.id && r.isActive);
          if (!resident) {
            return res.status(404).json({ error: 'Resident not found' });
          }
          
          // Get resident's rotations and academic progress
          const residentRotations = rotations.filter(rot => rot.residentId === query.id);
          const residentProgress = academicProgress.filter(prog => prog.residentId === query.id);
          
          return res.status(200).json({
            ...resident,
            rotations: residentRotations,
            academicProgress: residentProgress
          });
        } else {
          // Get all active residents
          const activeResidents = residents.filter(r => r.isActive);
          
          // Filter by year if specified
          let filteredResidents = activeResidents;
          if (query.year) {
            filteredResidents = activeResidents.filter(r => r.year === query.year);
          }
          
          // Filter by department if specified
          if (query.department) {
            filteredResidents = filteredResidents.filter(r => r.department === query.department);
          }
          
          return res.status(200).json({
            residents: filteredResidents,
            total: filteredResidents.length,
            byYear: {
              R1: activeResidents.filter(r => r.year === 'R1').length,
              R2: activeResidents.filter(r => r.year === 'R2').length,
              R3: activeResidents.filter(r => r.year === 'R3').length,
              R4: activeResidents.filter(r => r.year === 'R4').length,
              R5: activeResidents.filter(r => r.year === 'R5').length
            }
          });
        }

      case 'POST':
        // Create new resident
        const newResident = {
          id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          permissions: body.permissions || ['read']
        };

        // Validate required fields
        if (!newResident.firstName || !newResident.lastName || !newResident.email) {
          return res.status(400).json({ 
            error: 'First name, last name, and email are required' 
          });
        }

        // Check if email already exists
        const existingResident = residents.find(r => r.email === newResident.email && r.isActive);
        if (existingResident) {
          return res.status(409).json({ 
            error: 'A resident with this email already exists' 
          });
        }

        // Validate year
        const validYears = ['R1', 'R2', 'R3', 'R4', 'R5', 'Fellow', 'Attending'];
        if (newResident.year && !validYears.includes(newResident.year)) {
          return res.status(400).json({ 
            error: `Invalid year. Must be one of: ${validYears.join(', ')}` 
          });
        }

        residents.push(newResident);
        
        return res.status(201).json({
          message: 'Resident created successfully',
          resident: newResident
        });

      case 'PUT':
        // Update existing resident
        if (!query.id) {
          return res.status(400).json({ error: 'Resident ID is required' });
        }

        const residentIndex = residents.findIndex(r => r.id === query.id);
        if (residentIndex === -1) {
          return res.status(404).json({ error: 'Resident not found' });
        }

        // Don't allow changing email to one that already exists
        if (body.email && body.email !== residents[residentIndex].email) {
          const emailExists = residents.find(r => r.email === body.email && r.isActive && r.id !== query.id);
          if (emailExists) {
            return res.status(409).json({ 
              error: 'A resident with this email already exists' 
            });
          }
        }

        const updatedResident = {
          ...residents[residentIndex],
          ...body,
          updatedAt: new Date().toISOString()
        };

        residents[residentIndex] = updatedResident;

        return res.status(200).json({
          message: 'Resident updated successfully',
          resident: updatedResident
        });

      case 'DELETE':
        // Deactivate resident (soft delete)
        if (!query.id) {
          return res.status(400).json({ error: 'Resident ID is required' });
        }

        const deleteIndex = residents.findIndex(r => r.id === query.id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Resident not found' });
        }

        // Soft delete
        residents[deleteIndex] = {
          ...residents[deleteIndex],
          isActive: false,
          deactivatedAt: new Date().toISOString()
        };

        return res.status(200).json({
          message: 'Resident deactivated successfully'
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
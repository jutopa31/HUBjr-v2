// API endpoint for patient management
// Supports CRUD operations for patient records and medical assessments

import { cors, runMiddleware } from '../src/utils/cors.js';

// In-memory storage (replace with database in production)
let patients = [];
let patientAssessments = [];

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.id) {
          // Get specific patient
          const patient = patients.find(p => p.id === query.id);
          if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
          }
          
          // Get patient's assessments
          const assessments = patientAssessments.filter(a => a.patientId === query.id);
          
          return res.status(200).json({
            ...patient,
            assessments
          });
        } else {
          // Get all patients (with pagination)
          const page = parseInt(query.page) || 1;
          const limit = parseInt(query.limit) || 20;
          const startIndex = (page - 1) * limit;
          const endIndex = page * limit;
          
          const paginatedPatients = patients.slice(startIndex, endIndex);
          
          return res.status(200).json({
            patients: paginatedPatients,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(patients.length / limit),
              totalPatients: patients.length,
              hasNext: endIndex < patients.length,
              hasPrev: page > 1
            }
          });
        }

      case 'POST':
        // Create new patient
        const newPatient = {
          id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: body.residentId || 'unknown'
        };

        // Validate required fields
        if (!newPatient.firstName || !newPatient.lastName) {
          return res.status(400).json({ 
            error: 'First name and last name are required' 
          });
        }

        patients.push(newPatient);
        
        return res.status(201).json({
          message: 'Patient created successfully',
          patient: newPatient
        });

      case 'PUT':
        // Update existing patient
        if (!query.id) {
          return res.status(400).json({ error: 'Patient ID is required' });
        }

        const patientIndex = patients.findIndex(p => p.id === query.id);
        if (patientIndex === -1) {
          return res.status(404).json({ error: 'Patient not found' });
        }

        const updatedPatient = {
          ...patients[patientIndex],
          ...body,
          updatedAt: new Date().toISOString()
        };

        patients[patientIndex] = updatedPatient;

        return res.status(200).json({
          message: 'Patient updated successfully',
          patient: updatedPatient
        });

      case 'DELETE':
        // Delete patient (soft delete)
        if (!query.id) {
          return res.status(400).json({ error: 'Patient ID is required' });
        }

        const deleteIndex = patients.findIndex(p => p.id === query.id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Patient not found' });
        }

        // Soft delete
        patients[deleteIndex] = {
          ...patients[deleteIndex],
          deleted: true,
          deletedAt: new Date().toISOString()
        };

        // Also soft delete associated assessments
        patientAssessments = patientAssessments.map(assessment => 
          assessment.patientId === query.id 
            ? { ...assessment, deleted: true, deletedAt: new Date().toISOString() }
            : assessment
        );

        return res.status(200).json({
          message: 'Patient deleted successfully'
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
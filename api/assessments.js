// API endpoint for medical scale assessments
// Handles NIHSS, Glasgow, UPDRS, and all other medical scales

import { cors, runMiddleware } from '../src/utils/cors.js';

// In-memory storage (replace with database in production)
let assessments = [];

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.id) {
          // Get specific assessment
          const assessment = assessments.find(a => a.id === query.id);
          if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
          }
          return res.status(200).json(assessment);
        } else if (query.patientId) {
          // Get all assessments for a patient
          const patientAssessments = assessments.filter(
            a => a.patientId === query.patientId && !a.deleted
          );
          
          // Sort by date (newest first)
          patientAssessments.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          return res.status(200).json({
            assessments: patientAssessments,
            total: patientAssessments.length
          });
        } else {
          // Get all assessments with filtering
          let filteredAssessments = assessments.filter(a => !a.deleted);
          
          // Filter by scale type
          if (query.scaleType) {
            filteredAssessments = filteredAssessments.filter(
              a => a.scaleType === query.scaleType
            );
          }
          
          // Filter by resident
          if (query.residentId) {
            filteredAssessments = filteredAssessments.filter(
              a => a.performedBy === query.residentId
            );
          }
          
          // Filter by date range
          if (query.startDate) {
            filteredAssessments = filteredAssessments.filter(
              a => new Date(a.createdAt) >= new Date(query.startDate)
            );
          }
          
          if (query.endDate) {
            filteredAssessments = filteredAssessments.filter(
              a => new Date(a.createdAt) <= new Date(query.endDate)
            );
          }
          
          // Pagination
          const page = parseInt(query.page) || 1;
          const limit = parseInt(query.limit) || 50;
          const startIndex = (page - 1) * limit;
          const endIndex = page * limit;
          
          const paginatedAssessments = filteredAssessments.slice(startIndex, endIndex);
          
          return res.status(200).json({
            assessments: paginatedAssessments,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(filteredAssessments.length / limit),
              totalAssessments: filteredAssessments.length,
              hasNext: endIndex < filteredAssessments.length,
              hasPrev: page > 1
            }
          });
        }

      case 'POST':
        // Create new assessment
        const newAssessment = {
          id: `asmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!newAssessment.patientId || !newAssessment.scaleType || !newAssessment.results) {
          return res.status(400).json({ 
            error: 'Patient ID, scale type, and results are required' 
          });
        }

        // Validate scale type
        const validScales = [
          'NIHSS', 'Glasgow', 'UPDRS-I', 'UPDRS-II', 'UPDRS-III', 'UPDRS-IV',
          'MDS-Parkinson-2015', 'Ashworth', 'mRS', 'ASPECTS', 'CHA2DS2-VASc',
          'HAS-BLED', 'ICH', 'Hunt-Hess', 'McDonald-2024', 'MMSE', 'MoCA',
          'MIDAS', 'HIT-6', 'Hoehn-Yahr', 'EDSS', 'Engel', 'mICH'
        ];

        if (!validScales.includes(newAssessment.scaleType)) {
          return res.status(400).json({ 
            error: `Invalid scale type. Must be one of: ${validScales.join(', ')}` 
          });
        }

        assessments.push(newAssessment);
        
        return res.status(201).json({
          message: 'Assessment created successfully',
          assessment: newAssessment
        });

      case 'PUT':
        // Update existing assessment
        if (!query.id) {
          return res.status(400).json({ error: 'Assessment ID is required' });
        }

        const assessmentIndex = assessments.findIndex(a => a.id === query.id);
        if (assessmentIndex === -1) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        const updatedAssessment = {
          ...assessments[assessmentIndex],
          ...body,
          updatedAt: new Date().toISOString()
        };

        assessments[assessmentIndex] = updatedAssessment;

        return res.status(200).json({
          message: 'Assessment updated successfully',
          assessment: updatedAssessment
        });

      case 'DELETE':
        // Delete assessment (soft delete)
        if (!query.id) {
          return res.status(400).json({ error: 'Assessment ID is required' });
        }

        const deleteIndex = assessments.findIndex(a => a.id === query.id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // Soft delete
        assessments[deleteIndex] = {
          ...assessments[deleteIndex],
          deleted: true,
          deletedAt: new Date().toISOString()
        };

        return res.status(200).json({
          message: 'Assessment deleted successfully'
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
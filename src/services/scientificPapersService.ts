/**
 * Scientific Papers Service
 * CRUD operations for the Trabajos Científicos feature
 *
 * Uses robustQuery for timeout protection and retry logic
 */

import { supabase } from '../utils/supabase';
import { robustQuery, formatQueryError } from '../utils/queryHelpers';
import type {
  ScientificPaper,
  ScientificPaperCreateData,
  ScientificPaperUpdateData,
  ScientificPapersFilters,
  ScientificPapersStats,
  PaperStatus,
  PaperType,
  FileType
} from '../types/scientificPapers';

const TABLE_NAME = 'scientific_papers';
const STORAGE_BUCKET = 'scientific-papers';

// =============================================================================
// Fetch Operations
// =============================================================================

/**
 * Fetch all scientific papers for the given hospital context
 */
export async function fetchScientificPapers(
  hospitalContext: 'Posadas' | 'Julian',
  filters?: ScientificPapersFilters
): Promise<{ data: ScientificPaper[]; error?: string }> {
  try {
    console.log('[ScientificPapersService] fetchScientificPapers -> context:', hospitalContext);

    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('hospital_context', hospitalContext)
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.paper_type && filters.paper_type !== 'all') {
      query = query.eq('paper_type', filters.paper_type);
    }
    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigned_resident && filters.assigned_resident !== 'all') {
      query = query.contains('assigned_residents', [filters.assigned_resident]);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,event_name.ilike.%${filters.search}%`);
    }

    const result = await robustQuery(
      () => query,
      { timeout: 10000, retries: 2, operationName: 'fetchScientificPapers' }
    );

    const { data, error } = result as { data: ScientificPaper[] | null; error: any };

    if (error) {
      console.error('[ScientificPapersService] fetchScientificPapers error:', error);
      return { data: [], error: formatQueryError(error) };
    }

    console.log('[ScientificPapersService] fetchScientificPapers -> rows:', (data || []).length);
    return { data: (data || []) as ScientificPaper[] };
  } catch (e: any) {
    console.error('[ScientificPapersService] fetchScientificPapers unexpected error:', e);
    return { data: [], error: formatQueryError(e) };
  }
}

/**
 * Fetch a single scientific paper by ID
 */
export async function fetchScientificPaperById(
  id: string
): Promise<{ data: ScientificPaper | null; error?: string }> {
  try {
    console.log('[ScientificPapersService] fetchScientificPaperById -> id:', id);

    const result = await robustQuery(
      () => supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single(),
      { timeout: 8000, retries: 2, operationName: 'fetchScientificPaperById' }
    );

    const { data, error } = result as { data: ScientificPaper | null; error: any };

    if (error) {
      console.error('[ScientificPapersService] fetchScientificPaperById error:', error);
      return { data: null, error: formatQueryError(error) };
    }

    return { data };
  } catch (e: any) {
    console.error('[ScientificPapersService] fetchScientificPaperById unexpected error:', e);
    return { data: null, error: formatQueryError(e) };
  }
}

// =============================================================================
// Create Operations
// =============================================================================

/**
 * Create a new scientific paper
 */
export async function createScientificPaper(
  data: ScientificPaperCreateData
): Promise<{ success: boolean; data?: ScientificPaper; error?: string }> {
  try {
    console.log('[ScientificPapersService] createScientificPaper -> data:', data);

    const result = await robustQuery(
      () => supabase
        .from(TABLE_NAME)
        .insert([{
          title: data.title,
          description: data.description || null,
          paper_type: data.paper_type,
          event_name: data.event_name || null,
          deadline: data.deadline || null,
          status: data.status || 'pending',
          assigned_residents: data.assigned_residents || [],
          pending_tasks: data.pending_tasks || [],
          color: data.color || 'default',
          priority: data.priority || 'medium',
          hospital_context: data.hospital_context,
          created_by: data.created_by
        }])
        .select()
        .single(),
      { timeout: 15000, retries: 2, operationName: 'createScientificPaper' }
    );

    const { data: createdPaper, error } = result as { data: ScientificPaper | null; error: any };

    if (error) {
      console.error('[ScientificPapersService] createScientificPaper error:', error);
      return { success: false, error: formatQueryError(error) };
    }

    console.log('[ScientificPapersService] createScientificPaper -> success, id:', createdPaper?.id);
    return { success: true, data: createdPaper as ScientificPaper };
  } catch (e: any) {
    console.error('[ScientificPapersService] createScientificPaper unexpected error:', e);
    return { success: false, error: formatQueryError(e) };
  }
}

// =============================================================================
// Update Operations
// =============================================================================

/**
 * Update an existing scientific paper
 */
export async function updateScientificPaper(
  id: string,
  updates: ScientificPaperUpdateData
): Promise<{ success: boolean; data?: ScientificPaper; error?: string }> {
  try {
    console.log('[ScientificPapersService] updateScientificPaper -> id:', id, 'updates:', updates);

    const result = await robustQuery(
      () => supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      { timeout: 15000, retries: 2, operationName: 'updateScientificPaper' }
    );

    const { data: updatedPaper, error } = result as { data: ScientificPaper | null; error: any };

    if (error) {
      console.error('[ScientificPapersService] updateScientificPaper error:', error);
      return { success: false, error: formatQueryError(error) };
    }

    console.log('[ScientificPapersService] updateScientificPaper -> success');
    return { success: true, data: updatedPaper as ScientificPaper };
  } catch (e: any) {
    console.error('[ScientificPapersService] updateScientificPaper unexpected error:', e);
    return { success: false, error: formatQueryError(e) };
  }
}

/**
 * Change the status of a scientific paper
 */
export async function changeStatus(
  id: string,
  newStatus: PaperStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[ScientificPapersService] changeStatus -> id:', id, 'newStatus:', newStatus);

    const result = await robustQuery(
      () => supabase
        .from(TABLE_NAME)
        .update({ status: newStatus })
        .eq('id', id),
      { timeout: 10000, retries: 2, operationName: 'changeStatus' }
    );

    const { error } = result as { error: any };

    if (error) {
      console.error('[ScientificPapersService] changeStatus error:', error);
      return { success: false, error: formatQueryError(error) };
    }

    console.log('[ScientificPapersService] changeStatus -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[ScientificPapersService] changeStatus unexpected error:', e);
    return { success: false, error: formatQueryError(e) };
  }
}

// =============================================================================
// Delete Operations
// =============================================================================

/**
 * Delete a scientific paper and its associated files
 */
export async function deleteScientificPaper(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[ScientificPapersService] deleteScientificPaper -> id:', id);

    // First, get the paper to find any file URLs
    const { data: paper } = await fetchScientificPaperById(id);

    // Delete associated files from storage
    if (paper) {
      const filesToDelete: string[] = [];
      if (paper.abstract_url) filesToDelete.push(paper.abstract_url);
      if (paper.draft_url) filesToDelete.push(paper.draft_url);
      if (paper.final_url) filesToDelete.push(paper.final_url);

      if (filesToDelete.length > 0) {
        console.log('[ScientificPapersService] Deleting associated files:', filesToDelete.length);
        // Extract paths from URLs and delete from storage
        const paths = filesToDelete.map(url => {
          const match = url.match(/scientific-papers\/(.+)/);
          return match ? match[1] : null;
        }).filter(Boolean) as string[];

        if (paths.length > 0) {
          await supabase.storage.from(STORAGE_BUCKET).remove(paths);
        }
      }
    }

    // Delete the paper record
    const result = await robustQuery(
      () => supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id),
      { timeout: 10000, retries: 2, operationName: 'deleteScientificPaper' }
    );

    const { error } = result as { error: any };

    if (error) {
      console.error('[ScientificPapersService] deleteScientificPaper error:', error);
      return { success: false, error: formatQueryError(error) };
    }

    console.log('[ScientificPapersService] deleteScientificPaper -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[ScientificPapersService] deleteScientificPaper unexpected error:', e);
    return { success: false, error: formatQueryError(e) };
  }
}

// =============================================================================
// File Operations
// =============================================================================

/**
 * Upload a file for a scientific paper
 */
export async function uploadPaperFile(
  paperId: string,
  file: File,
  fileType: FileType
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('[ScientificPapersService] uploadPaperFile -> paperId:', paperId, 'fileType:', fileType);

    // Validate file type
    const validMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!validMimeTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de archivo no permitido. Solo PDF y DOCX.' };
    }

    // Generate unique file path
    const timestamp = Date.now();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const filePath = `${paperId}/${fileType}-${timestamp}.${extension}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[ScientificPapersService] uploadPaperFile storage error:', uploadError);
      return { success: false, error: 'Error al subir archivo: ' + uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update the paper record with the file URL
    const urlField = `${fileType}_url` as 'abstract_url' | 'draft_url' | 'final_url';
    const { success, error } = await updateScientificPaper(paperId, {
      [urlField]: publicUrl
    });

    if (!success) {
      // Rollback: delete uploaded file if DB update fails
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      return { success: false, error };
    }

    console.log('[ScientificPapersService] uploadPaperFile -> success, url:', publicUrl);
    return { success: true, url: publicUrl };
  } catch (e: any) {
    console.error('[ScientificPapersService] uploadPaperFile unexpected error:', e);
    return { success: false, error: formatQueryError(e) };
  }
}

/**
 * Delete a file from a scientific paper
 */
export async function deletePaperFile(
  paperId: string,
  fileType: FileType
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[ScientificPapersService] deletePaperFile -> paperId:', paperId, 'fileType:', fileType);

    // Get current paper to find the file URL
    const { data: paper } = await fetchScientificPaperById(paperId);
    if (!paper) {
      return { success: false, error: 'Trabajo no encontrado' };
    }

    const urlField = `${fileType}_url` as 'abstract_url' | 'draft_url' | 'final_url';
    const fileUrl = paper[urlField];

    if (fileUrl) {
      // Extract path from URL and delete from storage
      const match = fileUrl.match(/scientific-papers\/(.+)/);
      if (match) {
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([match[1]]);

        if (deleteError) {
          console.warn('[ScientificPapersService] deletePaperFile storage error:', deleteError);
          // Continue even if storage delete fails
        }
      }
    }

    // Update paper record to remove URL
    const { success, error } = await updateScientificPaper(paperId, {
      [urlField]: null
    });

    if (!success) {
      return { success: false, error };
    }

    console.log('[ScientificPapersService] deletePaperFile -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[ScientificPapersService] deletePaperFile unexpected error:', e);
    return { success: false, error: formatQueryError(e) };
  }
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Get statistics for scientific papers
 */
export async function getPapersStats(
  hospitalContext: 'Posadas' | 'Julian'
): Promise<{ data: ScientificPapersStats | null; error?: string }> {
  try {
    console.log('[ScientificPapersService] getPapersStats -> context:', hospitalContext);

    const { data: papers, error } = await fetchScientificPapers(hospitalContext);

    if (error) {
      return { data: null, error };
    }

    // Calculate stats
    const stats: ScientificPapersStats = {
      total: papers.length,
      byStatus: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        submitted: 0,
        accepted: 0,
        rejected: 0
      },
      byType: {
        abstract: 0,
        poster: 0,
        articulo: 0,
        caso_clinico: 0
      },
      urgentDeadlines: 0,
      overdueCount: 0
    };

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    papers.forEach(paper => {
      // Count by status
      if (paper.status in stats.byStatus) {
        stats.byStatus[paper.status]++;
      }

      // Count by type
      if (paper.paper_type in stats.byType) {
        stats.byType[paper.paper_type]++;
      }

      // Check deadline urgency
      if (paper.deadline) {
        const [year, month, day] = paper.deadline.split('-').map(Number);
        const deadlineDate = new Date(Date.UTC(year, month - 1, day));
        const diffTime = deadlineDate.getTime() - todayUTC.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          stats.overdueCount++;
        } else if (diffDays <= 7) {
          stats.urgentDeadlines++;
        }
      }
    });

    console.log('[ScientificPapersService] getPapersStats -> stats:', stats);
    return { data: stats };
  } catch (e: any) {
    console.error('[ScientificPapersService] getPapersStats unexpected error:', e);
    return { data: null, error: formatQueryError(e) };
  }
}

// =============================================================================
// Resident Helpers
// =============================================================================

/**
 * Fetch list of residents for assignment dropdown
 */
export async function fetchResidentsForAssignment(): Promise<{
  data: Array<{ email: string; name: string }>;
  error?: string;
}> {
  try {
    console.log('[ScientificPapersService] fetchResidentsForAssignment');

    const result = await robustQuery(
      () => supabase
        .from('resident_profiles')
        .select('email, first_name, last_name')
        .order('last_name'),
      { timeout: 8000, retries: 2, operationName: 'fetchResidentsForAssignment' }
    );

    const { data, error } = result as { data: any[] | null; error: any };

    if (error) {
      console.error('[ScientificPapersService] fetchResidentsForAssignment error:', error);
      return { data: [], error: formatQueryError(error) };
    }

    const residents = (data || []).map(r => {
      const fullName = `${r.first_name || ''} ${r.last_name || ''}`.trim();
      return {
        email: r.email,
        name: fullName || r.email
      };
    });

    console.log('[ScientificPapersService] fetchResidentsForAssignment -> count:', residents.length);
    return { data: residents };
  } catch (e: any) {
    console.error('[ScientificPapersService] fetchResidentsForAssignment unexpected error:', e);
    return { data: [], error: formatQueryError(e) };
  }
}

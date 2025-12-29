/**
 * Clipboard Service
 * Handles reading images and videos from system clipboard
 */

export interface ClipboardImageResult {
  files: FileList;
  fileName: string;
}

/**
 * Read image or video from clipboard and convert to FileList
 * @returns FileList with clipboard media (image or video), or null if none found
 * @throws Error if permission denied or clipboard read fails
 */
export async function readImageFromClipboard(): Promise<FileList | null> {
  try {
    // Request clipboard permission and read contents
    const clipboardItems = await navigator.clipboard.read();

    // Search for image or video in clipboard items
    for (const item of clipboardItems) {
      // Prefer explicit image/video types, then fall back to other types.
      const prioritizedTypes = [
        ...item.types.filter(type => type.startsWith('image/')),
        ...item.types.filter(type => type.startsWith('video/')),
        ...item.types
      ];
      const seenTypes = new Set<string>();

      for (const type of prioritizedTypes) {
        if (seenTypes.has(type)) continue;
        seenTypes.add(type);

        let blob: Blob;
        try {
          blob = await item.getType(type);
        } catch {
          continue;
        }

        const resolvedType = blob.type || type;
        const isImage = resolvedType.startsWith('image/');
        const isVideo = resolvedType.startsWith('video/');

        if (!isImage && !isVideo) continue;

        const extension = resolvedType.split('/')[1] || (isImage ? 'png' : 'mp4');
        const prefix = isImage ? 'clipboard' : 'clipboard-video';
        const fileName = `${prefix}-${Date.now()}.${extension}`;

        // Convert Blob to File
        const file = new File([blob], fileName, { type: resolvedType });

        // Create FileList using DataTransfer API
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        return dataTransfer.files;
      }
    }

    // No media found in clipboard
    return null;

  } catch (error) {
    // Permission denied or other clipboard error
    console.error('[ClipboardService] Error reading clipboard:', error);
    throw error;
  }
}

/**
 * Check if clipboard API is supported in current browser
 */
export function isClipboardSupported(): boolean {
  return !!(navigator?.clipboard?.read);
}

/**
 * Read files from a clipboard paste event (file copies from OS clipboard).
 */
export function getFilesFromClipboardEvent(event: ClipboardEvent): FileList | null {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return null;

  if (clipboardData.files && clipboardData.files.length > 0) {
    return clipboardData.files;
  }

  const files: File[] = [];
  for (const item of Array.from(clipboardData.items || [])) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }

  if (files.length === 0) return null;

  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  return dataTransfer.files;
}

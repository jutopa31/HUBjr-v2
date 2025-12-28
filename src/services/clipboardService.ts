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
      // Find first image type (image/png, image/jpeg, etc.)
      const imageType = item.types.find(type => type.startsWith('image/'));
      // Find first video type (video/mp4, video/webm, etc.)
      const videoType = item.types.find(type => type.startsWith('video/'));

      // Prefer image over video if both exist
      const mediaType = imageType || videoType;

      if (mediaType) {
        // Get the media blob
        const blob = await item.getType(mediaType);

        // Generate filename with timestamp and correct extension
        const extension = mediaType.split('/')[1] || (imageType ? 'png' : 'mp4');
        const prefix = imageType ? 'clipboard' : 'clipboard-video';
        const fileName = `${prefix}-${Date.now()}.${extension}`;

        // Convert Blob to File
        const file = new File([blob], fileName, { type: mediaType });

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

/**
 * Clipboard Service
 * Handles reading images from system clipboard
 */

export interface ClipboardImageResult {
  files: FileList;
  fileName: string;
}

/**
 * Read image from clipboard and convert to FileList
 * @returns FileList with clipboard image, or null if no image found
 * @throws Error if permission denied or clipboard read fails
 */
export async function readImageFromClipboard(): Promise<FileList | null> {
  try {
    // Request clipboard permission and read contents
    const clipboardItems = await navigator.clipboard.read();

    // Search for image in clipboard items
    for (const item of clipboardItems) {
      // Find first image type (image/png, image/jpeg, etc.)
      const imageType = item.types.find(type => type.startsWith('image/'));

      if (imageType) {
        // Get the image blob
        const blob = await item.getType(imageType);

        // Generate filename with timestamp and correct extension
        const extension = imageType.split('/')[1] || 'png';
        const fileName = `clipboard-${Date.now()}.${extension}`;

        // Convert Blob to File
        const file = new File([blob], fileName, { type: imageType });

        // Create FileList using DataTransfer API
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        return dataTransfer.files;
      }
    }

    // No image found in clipboard
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

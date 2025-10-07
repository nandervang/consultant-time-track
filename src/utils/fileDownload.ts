/**
 * Utility functions for handling file downloads
 */

export interface DownloadableFile {
  content: string; // base64 or URL
  filename: string;
  mimeType: string;
}

/**
 * Check if a string is a base64 data URL
 */
export function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Extract base64 content from data URL
 */
export function extractBase64Content(dataUrl: string): string {
  const base64Index = dataUrl.indexOf('base64,');
  if (base64Index === -1) {
    throw new Error('Invalid base64 data URL');
  }
  return dataUrl.substring(base64Index + 7); // 7 = 'base64,'.length
}

/**
 * Convert base64 string to Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Download a file from base64 content or URL
 */
export function downloadFile(file: DownloadableFile): void {
  console.log('Downloading file:', { 
    filename: file.filename, 
    mimeType: file.mimeType,
    isBase64: isBase64DataUrl(file.content),
    contentPreview: file.content.substring(0, 50) + '...'
  });

  if (isBase64DataUrl(file.content)) {
    // Handle base64 data URL
    console.log('Processing base64 data URL...');
    const base64Content = extractBase64Content(file.content);
    const blob = base64ToBlob(base64Content, file.mimeType);
    console.log('Created blob:', { size: blob.size, type: blob.type });
    downloadBlob(blob, file.filename);
  } else {
    // Handle regular URL - create temporary link
    console.log('Processing regular URL...');
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.filename;
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  console.log('Creating download link for blob:', { size: blob.size, type: blob.type, filename });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  
  console.log('Download link created:', { href: url.substring(0, 50) + '...', download: filename });
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
  
  console.log('Download initiated and cleanup completed');
}

/**
 * Generate a filename for CV downloads
 */
export function generateCVFilename(
  personalInfo: { fullName?: string; firstName?: string; lastName?: string } = {},
  format: string = 'pdf',
  templateName?: string
): string {
  // Extract name
  const fullName = personalInfo.fullName || 
    `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() ||
    'CV';
  
  // Clean name for filename (remove special characters)
  const cleanName = fullName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  
  // Add template suffix if provided
  const templateSuffix = templateName ? `_${templateName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  
  // Add timestamp to avoid conflicts
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  return `${cleanName}${templateSuffix}_${timestamp}.${format}`;
}

/**
 * Get MIME type for common file formats
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    html: 'text/html',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml'
  };
  
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
}
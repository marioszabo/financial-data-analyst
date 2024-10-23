/**
 * File Handling Utilities
 * Collection of functions for reading different file formats in browser environment
 */

/**
 * Reads a file as plain text
 * 
 * Uses FileReader API to asynchronously read file contents
 * Includes validation for empty or invalid text files
 * 
 * @param file - File object to read
 * @returns Promise resolving to file contents as string
 * @throws Error for empty files or reading failures
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result;
        if (typeof result === "string" && result.length > 0) {
          resolve(result);
        } else {
          reject(new Error("Empty or invalid text file"));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Converts file to base64 encoding
 * 
 * Useful for:
 * - API submissions requiring base64
 * - Image preview generation
 * - File content validation
 * 
 * @param file - File object to encode
 * @returns Promise resolving to base64 string (without data URL prefix)
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        // Extract base64 data from data URL format
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts text content from PDF files
 * 
 * Features:
 * - Dynamically loads PDF.js library
 * - Processes multi-page documents
 * - Preserves text layout and spacing
 * - Handles line breaks based on Y-coordinates
 * 
 * Limitations:
 * - Requires internet connection for PDF.js CDN
 * - May not handle complex PDF layouts perfectly
 * - Performance depends on PDF size and complexity
 * 
 * @param file - PDF file to process
 * @returns Promise resolving to extracted text content
 * @throws Error if PDF.js fails to load or process file
 */
export const readFileAsPDFText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

    script.onload = async () => {
      try {
        // Initialize PDF.js with worker
        // @ts-ignore - PDF.js adds this to window
        const pdfjsLib = window["pdfjs-dist/build/pdf"];
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        // Read PDF content
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = "";

        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          let lastY: number | null = null;
          let text = "";

          // Reconstruct text layout using Y-coordinates
          for (const item of textContent.items) {
            // Add line break if Y position changes significantly
            if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
              text += "\n";
            } else if (lastY !== null && text.length > 0) {
              text += " ";
            }

            text += item.str;
            lastY = item.transform[5];
          }

          fullText += text + "\n\n";
        }

        // Cleanup and resolve
        document.body.removeChild(script);
        resolve(fullText.trim());
      } catch (error) {
        document.body.removeChild(script);
        reject(error);
      }
    };

    script.onerror = () => {
      document.body.removeChild(script);
      reject(new Error("Failed to load PDF.js library"));
    };

    document.body.appendChild(script);
  });
};

/**
 * File Upload Interface
 * 
 * Standardizes file metadata for upload operations
 * Used across components for consistent file handling
 */
export interface FileUpload {
  base64: string;      // File content encoded in base64
  fileName: string;    // Original file name with extension
  mediaType: string;   // MIME type for content validation
  isText?: boolean;    // Flag for text-based files
  fileSize?: number;   // File size in bytes for validation
}

export interface StorageProvider {
  /**
   * Uploads a file and returns its public URL
   * @param file The file buffer
   * @param filename The original or generated filename
   * @param mimeType The MIME type of the file
   */
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;

  /**
   * Deletes a file based on its URL or path
   * @param fileUrl The public URL or path of the file
   */
  delete(fileUrl: string): Promise<void>;

  /**
   * Returns the public URL for a given path
   * @param path The relative storage path
   */
  getUrl(path: string): string;
}

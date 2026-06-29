import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from './types';

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private publicPrefix: string;

  constructor() {
    // Store files in the public/uploads directory so Next.js can serve them directly
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.publicPrefix = '/uploads';
  }

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    await this.ensureDir();
    
    // Generate a unique filename to prevent overwriting
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const safeFilename = `${baseName}-${uniqueSuffix}${ext}`;
    
    const filePath = path.join(this.uploadDir, safeFilename);
    await fs.writeFile(filePath, file);

    return this.getUrl(safeFilename);
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      // Extract the filename from the URL
      if (!fileUrl.startsWith(this.publicPrefix)) return;
      
      const filename = fileUrl.replace(`${this.publicPrefix}/`, '');
      const filePath = path.join(this.uploadDir, filename);
      
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file: ${fileUrl}`, error);
    }
  }

  getUrl(filename: string): string {
    return `${this.publicPrefix}/${filename}`;
  }
}

import { StorageProvider } from './types';
import { LocalStorageProvider } from './local-provider';

// In the future, this can dynamically load AWS S3, Azure, etc. based on process.env
function createStorageProvider(): StorageProvider {
  const providerType = process.env.STORAGE_PROVIDER || 'local';

  switch (providerType) {
    case 'local':
      return new LocalStorageProvider();
    default:
      console.warn(`Unknown storage provider: ${providerType}, falling back to local.`);
      return new LocalStorageProvider();
  }
}

export const storage = createStorageProvider();
export * from './types';

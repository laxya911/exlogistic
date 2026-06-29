import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './src/repositories/prisma.client';

try {
  const adapter = PrismaAdapter(prisma);
  console.log('Adapter instantiated successfully');
} catch (error) {
  console.error('Error instantiating adapter:', error);
}

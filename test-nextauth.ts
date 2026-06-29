import NextAuth from 'next-auth';
import { authOptions } from './src/lib/auth';

console.log('Testing NextAuth initialization...');
try {
  // Simulate NextAuth initialization
  const handler = NextAuth(authOptions);
  console.log('NextAuth initialized successfully');
} catch (error) {
  console.error('NextAuth Error:', error);
}

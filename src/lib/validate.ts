import { z } from 'zod';
import { NextResponse } from 'next/server';
import { logger } from './logger';

export async function validateBody<T>(
  request: Request,
  schema: z.Schema<T>
): Promise<{ data?: T; errorResponse?: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      logger.warn('Validation Failed', { errors: result.error.flatten() });
      return {
        errorResponse: NextResponse.json(
          { 
            error: 'Validation Error', 
            details: result.error.flatten().fieldErrors 
          }, 
          { status: 400 }
        )
      };
    }

    return { data: result.data };
  } catch (e) {
    return {
      errorResponse: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    };
  }
}

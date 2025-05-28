import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Define roles hierarchy for permission checks
const roleHierarchy = {
  admin: 4,
  manager: 3,
  employee: 2,
  client: 1,
};

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}

export function isAuthenticated(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req);
  };
}

export function hasRole(
  requiredRole: string | string[],
  handler: (req: NextRequest, context?: { params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: any }) => {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    // Handle array of required roles
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasPermission = requiredRoles.some(role => hasRequiredRole(userRole, role));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, context || { params: {} });
  };
}

// Helper for handling API errors
export function handleApiError(error: any) {
  console.error('API error:', error);
  
  if (error.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }
  
  if (error.code === 11000) {
    // Duplicate key error
    return NextResponse.json({ error: 'Duplicate entry' }, { status: 409 });
  }
  
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withErrorHandler, createSuccessResponse, createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@/lib/api-error-handler';

export const GET = withErrorHandler(async () => {
  await dbConnect();
  
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return createErrorResponse(
      'Authentication required',
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const user = await User.findById(session.user.id)
    .select('-password')
    .populate('department', 'name');

  if (!user) {
    return createErrorResponse(
      'User not found',
      ERROR_CODES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return createSuccessResponse(user, 'Profile retrieved successfully');
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  await dbConnect();
  
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return createErrorResponse(
      'Authentication required',
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const body = await request.json();
  const allowedFields = ['name', 'phone', 'address', 'bio', 'profileImage', 'notifications'];
  
  const updateData: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return createErrorResponse(
      'No valid fields provided for update',
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const user = await User.findByIdAndUpdate(
    session.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password').populate('department', 'name');

  if (!user) {
    return createErrorResponse(
      'User not found',
      ERROR_CODES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return createSuccessResponse(user, 'Profile updated successfully');
});

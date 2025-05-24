import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hasRole, handleApiError } from '@/lib/api-utils';

export const POST = hasRole('admin', async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { action, userIds } = body;
    
    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Invalid request. Action and userIds are required.' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'delete':
        // Soft delete multiple users
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: false } }
        );
        
        return NextResponse.json({
          message: `${result.modifiedCount} user(s) deactivated successfully`,
          modifiedCount: result.modifiedCount
        });
        
      case 'activate':
        // Activate multiple users
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: true } }
        );
        
        return NextResponse.json({
          message: `${result.modifiedCount} user(s) activated successfully`,
          modifiedCount: result.modifiedCount
        });
        
      case 'export':
        // Export user data (basic implementation)
        const users = await User.find({ _id: { $in: userIds } })
          .select('-password')
          .populate('department', 'name')
          .lean();
          
        return NextResponse.json({
          message: 'Users exported successfully',
          data: users
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: delete, activate, export' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
});

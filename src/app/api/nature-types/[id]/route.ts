import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import NatureType from '@/models/NatureType';
import mongoose from 'mongoose';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET - Fetch specific nature type (for all authenticated users)
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid nature type ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const natureType = await NatureType.findById(params.id)
      .populate('createdBy', 'name email')
      .select('name description isActive createdAt updatedAt createdBy');

    if (!natureType) {
      return NextResponse.json(
        { error: 'Nature type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ natureType }, { status: 200 });
  } catch (error) {
    console.error('Error fetching nature type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update nature type (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid nature type ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if nature type exists
    const existingNatureType = await NatureType.findById(params.id);
    if (!existingNatureType) {
      return NextResponse.json(
        { error: 'Nature type not found' },
        { status: 404 }
      );
    }

    // Check if another nature type with same name exists (excluding current one)
    const duplicateNatureType = await NatureType.findOne({
      _id: { $ne: params.id },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (duplicateNatureType) {
      return NextResponse.json(
        { error: 'Nature type with this name already exists' },
        { status: 409 }
      );
    }

    const updatedNatureType = await NatureType.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        description: description.trim(),
        isActive: isActive !== undefined ? isActive : existingNatureType.isActive,
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    return NextResponse.json(
      { 
        message: 'Nature type updated successfully',
        natureType: updatedNatureType 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating nature type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete nature type (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid nature type ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if nature type exists
    const natureType = await NatureType.findById(params.id);
    if (!natureType) {
      return NextResponse.json(
        { error: 'Nature type not found' },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false instead of removing
    await NatureType.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    return NextResponse.json(
      { message: 'Nature type deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting nature type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

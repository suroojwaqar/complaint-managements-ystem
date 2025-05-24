import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import NatureType from '@/models/NatureType';

// GET - Fetch all nature types (for all authenticated users)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    // Build query based on user role and parameters
    let query: any = {};
    
    // If not admin or not requesting inactive, only show active nature types
    if (session.user.role !== 'admin' || !includeInactive) {
      query.isActive = true;
    }

    const natureTypes = await NatureType.find(query)
      .populate('createdBy', 'name email')
      .select('name description isActive createdAt updatedAt createdBy')
      .sort({ name: 1 });

    return NextResponse.json({ natureTypes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching nature types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new nature type (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if nature type already exists
    const existingNatureType = await NatureType.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingNatureType) {
      return NextResponse.json(
        { error: 'Nature type with this name already exists' },
        { status: 409 }
      );
    }

    const natureType = new NatureType({
      name: name.trim(),
      description: description.trim(),
      createdBy: session.user.id,
    });

    await natureType.save();

    const populatedNatureType = await NatureType.findById(natureType._id)
      .populate('createdBy', 'name email')
      .select('name description isActive createdAt createdBy');

    return NextResponse.json(
      { 
        message: 'Nature type created successfully',
        natureType: populatedNatureType 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating nature type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

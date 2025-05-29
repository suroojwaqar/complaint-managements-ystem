import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Settings Schema
const settingsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    default: 'system'
  },
  autoRouting: {
    enabled: {
      type: Boolean,
      default: true
    },
    departments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    }]
  },
  defaultDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure we don't create multiple models
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    await dbConnect();

    // Get system settings (there should only be one)
    let settings = await Settings.findOne({ type: 'system' }).populate('defaultDepartment');

    // If no settings exist, create default ones
    if (!settings) {
      settings = new Settings({
        type: 'system',
        autoRouting: {
          enabled: true,
          departments: []
        }
      });
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings: {
        autoRouting: settings.autoRouting,
        defaultDepartment: settings.defaultDepartment
      }
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Received settings data:', body);
    
    const { autoRouting, defaultDepartment } = body;
    console.log('Parsed autoRouting:', autoRouting);
    console.log('Parsed defaultDepartment:', defaultDepartment);

    // Validate input
    if (!autoRouting || typeof autoRouting.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid autoRouting configuration' }, { status: 400 });
    }

    if (!Array.isArray(autoRouting.departments)) {
      return NextResponse.json({ error: 'Invalid departments configuration' }, { status: 400 });
    }

    // Validate department IDs are valid ObjectIds
    for (const deptId of autoRouting.departments) {
      if (!mongoose.Types.ObjectId.isValid(deptId)) {
        return NextResponse.json({ error: `Invalid department ID: ${deptId}` }, { status: 400 });
      }
    }

    // Validate default department ID if provided
    if (defaultDepartment && !mongoose.Types.ObjectId.isValid(defaultDepartment)) {
      return NextResponse.json({ error: 'Invalid default department ID' }, { status: 400 });
    }

    await dbConnect();

    // Update or create settings
    let settings = await Settings.findOne({ type: 'system' });

    if (settings) {
      // Update existing settings
      settings.autoRouting = autoRouting;
      settings.defaultDepartment = defaultDepartment || null;
      settings.updatedAt = new Date();
    } else {
      // Create new settings
      settings = new Settings({
        type: 'system',
        autoRouting,
        defaultDepartment: defaultDepartment || null
      });
    }

    await settings.save();

    // Populate the response
    await settings.populate('defaultDepartment');

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        autoRouting: settings.autoRouting,
        defaultDepartment: settings.defaultDepartment
      }
    });

  } catch (error: any) {
    console.error('Error updating settings:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
    }, { status: 500 });
  }
}
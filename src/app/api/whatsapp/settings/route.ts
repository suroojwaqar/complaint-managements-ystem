import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Get WhatsApp settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = {
      isConfigured: !!(process.env.WAAPI_INSTANCE_ID && process.env.WAAPI_API_KEY),
      baseUrl: process.env.WAAPI_BASE_URL || 'https://waapi.app/api/v1',
      instanceId: process.env.WAAPI_INSTANCE_ID ? '***' + process.env.WAAPI_INSTANCE_ID.slice(-4) : null,
      apiKey: process.env.WAAPI_API_KEY ? '***' + process.env.WAAPI_API_KEY.slice(-4) : null,
    };

    return NextResponse.json(settings);

  } catch (error: any) {
    console.error('Error fetching WhatsApp settings:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

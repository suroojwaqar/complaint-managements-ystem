// Test WAAPI credentials directly
// Run with: node scripts/test-waapi-credentials.js

require('dotenv').config({ path: '.env.local' });

async function testWaapiCredentials() {
  const instanceId = process.env.WAAPI_INSTANCE_ID;
  const apiKey = process.env.WAAPI_API_KEY;
  const baseUrl = process.env.WAAPI_BASE_URL || 'https://waapi.app/api/v1';

  console.log('=== TESTING WAAPI CREDENTIALS ===');
  console.log('Instance ID:', instanceId);
  console.log('API Key:', apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-8)}` : 'NOT SET');
  console.log('Base URL:', baseUrl);
  console.log('');

  if (!instanceId || !apiKey) {
    console.log('❌ WAAPI credentials not configured');
    return;
  }

  try {
    // Test 1: Check if instance exists and is connected
    console.log('Test 1: Checking instance connection...');
    const connectionResponse = await fetch(`${baseUrl}/instances/${instanceId}/client/action/is-connected`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
    });

    console.log('Connection Response Status:', connectionResponse.status, connectionResponse.statusText);
    
    if (connectionResponse.status === 403) {
      console.log('❌ 403 FORBIDDEN - Invalid API key or no permission');
      const errorText = await connectionResponse.text();
      console.log('Error Details:', errorText);
      return;
    }

    if (connectionResponse.status === 404) {
      console.log('❌ 404 NOT FOUND - Invalid instance ID');
      return;
    }

    if (connectionResponse.ok) {
      const result = await connectionResponse.json();
      console.log('✅ Connection test successful');
      console.log('WhatsApp Status:', result.connected ? 'Connected' : 'Disconnected');
      
      if (!result.connected) {
        console.log('⚠️  WhatsApp instance is not connected. You need to scan QR code.');
      }
    } else {
      const errorText = await connectionResponse.text();
      console.log('❌ Connection test failed:', errorText);
    }

    // Test 2: Try to get instance info
    console.log('\nTest 2: Getting instance information...');
    const infoResponse = await fetch(`${baseUrl}/instances/${instanceId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('Info Response Status:', infoResponse.status, infoResponse.statusText);
    
    if (infoResponse.ok) {
      const info = await infoResponse.json();
      console.log('✅ Instance info retrieved');
      console.log('Instance Details:', JSON.stringify(info, null, 2));
    } else {
      const errorText = await infoResponse.text();
      console.log('❌ Failed to get instance info:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testWaapiCredentials();
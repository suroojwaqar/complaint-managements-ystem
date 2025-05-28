// Test exact same request as your working curl command
// Run with: node scripts/test-exact-curl.js

require('dotenv').config({ path: '.env.local' });

async function testExactCurl() {
  console.log('=== TESTING EXACT CURL COMMAND ===');
  
  const instanceId = process.env.WAAPI_INSTANCE_ID;
  const apiKey = process.env.WAAPI_API_KEY;
  const baseUrl = process.env.WAAPI_BASE_URL || 'https://waapi.app/api/v1';
  
  console.log('Instance ID:', instanceId);
  console.log('API Key:', apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-8)}` : 'NOT SET');
  console.log('Base URL:', baseUrl);
  
  if (!instanceId || !apiKey) {
    console.log('❌ Credentials not set in .env.local');
    return;
  }
  
  const fullUrl = `${baseUrl}/instances/${instanceId}/client/action/send-message`;
  console.log('Full URL:', fullUrl);
  
  const payload = {
    "chatId": "923343867280@c.us",
    "message": "test from Node.js script"
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  const headers = {
    'accept': 'application/json',
    'authorization': `Bearer ${apiKey}`,
    'content-type': 'application/json'
  };
  
  console.log('Headers:', {
    'accept': headers.accept,
    'authorization': `Bearer ${apiKey.slice(0, 8)}...${apiKey.slice(-8)}`,
    'content-type': headers['content-type']
  });
  
  try {
    console.log('\n=== MAKING REQUEST ===');
    console.log('URL:', fullUrl);
    console.log('Method: POST');
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status, response.statusText);
    console.log('Response URL:', response.url);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Message sent via Node.js');
      console.log('This proves your credentials work from Node.js too');
    } else {
      console.log('\n❌ FAILED! Status:', response.status);
      console.log('This means there\'s an issue with the request format or credentials');
      
      if (response.status === 403) {
        console.log('🔍 403 Forbidden - Check your API key');
      } else if (response.status === 404) {
        console.log('🔍 404 Not Found - Check your instance ID');
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testExactCurl();
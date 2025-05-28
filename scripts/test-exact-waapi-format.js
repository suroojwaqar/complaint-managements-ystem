// Test exact WAAPI format from documentation
// Run with: node scripts/test-exact-waapi-format.js

require('dotenv').config({ path: '.env.local' });

async function testExactWaapiFormat() {
  const instanceId = process.env.WAAPI_INSTANCE_ID;
  const apiKey = process.env.WAAPI_API_KEY;
  
  console.log('=== TESTING EXACT WAAPI FORMAT ===');
  console.log('Using your credentials to test the exact curl format...');
  
  if (!instanceId || !apiKey) {
    console.log('❌ Credentials not configured');
    return;
  }

  try {
    // Exact format from WAAPI docs
    const response = await fetch(`https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        "chatId": "0334398234@c.us", // Using the example from docs
        "message": "Test message from Node.js script"
      })
    });

    console.log('Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (response.status === 403) {
      console.log('\n❌ 403 FORBIDDEN - Your API credentials are invalid');
      console.log('Solutions:');
      console.log('1. Check if your WAAPI account is active');
      console.log('2. Verify Instance ID and API Key are correct');
      console.log('3. Create a new instance and get fresh credentials');
    } else if (response.status === 200) {
      console.log('\n✅ Message sent successfully!');
      console.log('The issue was in the previous format, not credentials');
    } else {
      console.log(`\n❓ Unexpected response: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testExactWaapiFormat();
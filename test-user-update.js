// Test script to verify MongoDB connection and User model
// Run this in your browser console on the edit page to test

async function testUserUpdate() {
  console.log('=== USER UPDATE TEST ===');
  
  // Get the user ID from the current page
  const userId = window.location.pathname.split('/').pop().replace('/edit', '');
  console.log('Testing with User ID:', userId);
  
  try {
    // First, test GET request
    console.log('1. Testing GET request...');
    const getResponse = await fetch(`/api/users/${userId}`);
    console.log('GET Status:', getResponse.status);
    
    if (!getResponse.ok) {
      console.error('GET request failed:', await getResponse.text());
      return;
    }
    
    const userData = await getResponse.json();
    console.log('2. User data retrieved:', userData.name);
    
    // Test a simple update (just update the same data)
    console.log('3. Testing PUT request with existing data...');
    const updateData = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department?._id || null,
      isActive: userData.isActive
    };
    
    console.log('4. Update data:', updateData);
    
    const putResponse = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    console.log('5. PUT Status:', putResponse.status);
    console.log('6. PUT Status Text:', putResponse.statusText);
    
    const responseText = await putResponse.text();
    console.log('7. PUT Response:', responseText);
    
    if (putResponse.ok) {
      console.log('✅ UPDATE TEST SUCCESSFUL!');
      try {
        const updatedUser = JSON.parse(responseText);
        console.log('Updated user:', updatedUser.name);
      } catch (e) {
        console.log('Response is not JSON:', responseText);
      }
    } else {
      console.error('❌ UPDATE TEST FAILED');
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Non-JSON error response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:', error);
  }
  
  console.log('=== USER UPDATE TEST END ===');
}

// Run the test
testUserUpdate();

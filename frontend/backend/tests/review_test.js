// Review and Comment API Test

const fetch = require('node-fetch');
const crypto = require('crypto-js');

const SERVER_URL = 'http://localhost:3000'; 
const SECRET_KEY = '65-a4fdy777nn98sns866by66554fdrfrtty'; // Same key as in server.js

// Test user credentials - use an existing test user in your database
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Sample test song ID - replace with a valid song ID from your database
const TEST_SONG_ID = 15;

// Helper function to encrypt email as token (matches server implementation)
function encryptToken(email) {
  return crypto.AES.encrypt(email, SECRET_KEY).toString();
}

// Test login to get a valid token
async function testLogin() {
  console.log('Testing login...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Login failed: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    console.log('Login successful');
    return data.token;
  } catch (error) {
    console.error('Error during login test:', error);
    return null;
  }
}

// Test adding a review
async function testAddReview(token) {
  console.log('\nTesting review submission...');
  
  if (!token) {
    console.error('No token available, skipping review test');
    return false;
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/songs/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        songId: TEST_SONG_ID,
        comment: 'This is a test review comment',
        rating: 4
      })
    });

    // Get response as text first to debug any issues
    const responseText = await response.text();
    console.log(`Response from review API: ${response.status}`);
    console.log('Response content:', responseText);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed JSON response:', data);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error('Error during review test:', error);
    return false;
  }
}

// Test adding a comment
async function testAddComment(token) {
  console.log('\nTesting comment submission...');
  
  if (!token) {
    console.error('No token available, skipping comment test');
    return false;
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/songs/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        songId: TEST_SONG_ID,
        comment: 'This is a test standalone comment'
      })
    });

    // Get response as text first to debug any issues
    const responseText = await response.text();
    console.log(`Response from comment API: ${response.status}`);
    console.log('Response content:', responseText);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed JSON response:', data);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error('Error during comment test:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Starting review and comment API tests...');
  
  // First get a token via login
  const token = await testLogin();
  if (!token) {
    console.error('Failed to get authentication token, tests cannot proceed');
    process.exit(1);
  }
  
  // Test review submission
  const reviewResult = await testAddReview(token);
  console.log(`Review test ${reviewResult ? 'PASSED' : 'FAILED'}`);
  
  // Test comment submission
  const commentResult = await testAddComment(token);
  console.log(`Comment test ${commentResult ? 'PASSED' : 'FAILED'}`);
  
  // Overall test results
  if (reviewResult && commentResult) {
    console.log('\nAll tests PASSED');
    process.exit(0);
  } else {
    console.log('\nSome tests FAILED');
    process.exit(1);
  }
}

// Start the tests
runTests();

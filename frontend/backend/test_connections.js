#!/usr/bin/env node
/**
 * Test script to validate Node.js to Flask communication
 */
const fetch = require('node-fetch');

// Test direct connection to Flask server
async function testFlaskConnection() {
  console.log('Testing direct connection to Flask server...');
  
  try {
    const response = await fetch('http://localhost:5000/api/test');
    if (!response.ok) {
      console.error('❌ Flask server test failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Flask server test succeeded:', data);
    return true;
  } catch (error) {
    console.error('❌ Flask server connection error:', error.message);
    return false;
  }
}

// Test review API
async function testReviewAPI() {
  console.log('\nTesting review API...');
  
  const testPayload = {
    userId: 'test@example.com',
    trackId: 1,
    comment: 'Test comment',
    rating: 5
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/addReview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      console.error('❌ Review API test failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Review API test succeeded:', data);
    return true;
  } catch (error) {
    console.error('❌ Review API test error:', error.message);
    return false;
  }
}

async function runTests() {
  const flaskConnected = await testFlaskConnection();
  
  if (!flaskConnected) {
    console.log('⚠️ Flask server is not responding. Make sure it is running on port 5000.');
    return;
  }
  
  await testReviewAPI();
}

runTests().catch(console.error);

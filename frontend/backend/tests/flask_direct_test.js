// Test script to directly test the Flask routes
const fetch = require('node-fetch');

async function testFlaskRoute() {
  console.log('Testing Flask API routes directly...');

  const testPayload = {
    userId: 'test@example.com',
    trackId: 1,
    comment: 'Test direct comment',
    rating: 5
  };

  // Test the /api/addReview endpoint
  console.log('\nTesting /api/addReview...');
  try {
    const response1 = await fetch('http://localhost:5000/api/addReview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ /api/addReview success:', data1);
    } else {
      const error1 = await response1.text();
      console.log('❌ /api/addReview failed:', response1.status, error1);
    }
  } catch (error) {
    console.error('Error testing /api/addReview:', error);
  }

  // Test the /addReview endpoint (no /api prefix)
  console.log('\nTesting /addReview...');
  try {
    const response2 = await fetch('http://localhost:5000/addReview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ /addReview success:', data2);
    } else {
      const error2 = await response2.text();
      console.log('❌ /addReview failed:', response2.status, error2);
    }
  } catch (error) {
    console.error('Error testing /addReview:', error);
  }
}

testFlaskRoute().catch(console.error);

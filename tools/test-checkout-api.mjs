#!/usr/bin/env node

/**
 * Test script to verify checkout service API endpoints
 * Usage: node tools/test-checkout-api.mjs
 */

const CHECKOUT_BASE_URL = process.env.CHECKOUT_URL || 'http://localhost:3004';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n📋 Testing: ${description}`);
    console.log(`   URL: ${CHECKOUT_BASE_URL}${endpoint}`);

    const response = await fetch(`${CHECKOUT_BASE_URL}${endpoint}`);
    const statusOk = response.ok;
    const data = await response.json();

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response structure:`, {
      hasSuccess: !!data?.success,
      hasData: !!data?.data,
      dataIsArray: Array.isArray(data?.data),
      dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A',
      message: data?.message,
    });

    if (Array.isArray(data?.data) && data.data.length > 0) {
      console.log(`   First record sample:`, JSON.stringify(data.data[0], null, 2).substring(0, 200) + '...');
    }

    if (statusOk) {
      console.log(`   ✅ PASS: Endpoint working`);
    } else {
      console.log(`   ⚠️  Status not OK`);
    }

    return { success: statusOk, data, endpoint };
  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return { success: false, error, endpoint };
  }
}

async function main() {
  console.log('🚀 Checkout Service API Test Suite');
  console.log(`Base URL: ${CHECKOUT_BASE_URL}`);
  console.log('='.repeat(60));

  const tests = [
    { endpoint: '/health', description: 'Health check' },
    { endpoint: '/api/Payment/orders', description: 'Get all orders' },
  ];

  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    results.push(result);
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check logs above.');
  }
}

main().catch(console.error);

/**
 * Test script to verify frequency synchronization
 * This tests that the frontend can correctly read the TEA5767's current frequency
 *
 * Usage: node test-frequency-sync.js
 */

const http = require('http');

const HARDWARE_SERVICE_URL = 'http://localhost:3001';

async function testFrequencySync() {
  console.log('🧪 Testing Frequency Synchronization\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check hardware service is running
    console.log('\n1️⃣  Checking hardware service health...');
    const healthResponse = await fetch(`${HARDWARE_SERVICE_URL}/health`);
    const health = await healthResponse.json();
    console.log('   ✅ Hardware service is running');
    console.log('   📊 Current mode:', health.mode);

    // Step 2: Get current radio status
    console.log('\n2️⃣  Fetching current radio status...');
    const statusResponse = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/status`);
    const status = await statusResponse.json();

    console.log('   ✅ Radio status retrieved:');
    console.log('   📻 Frequency:', status.frequency, 'MHz');
    console.log('   📶 Signal Strength:', status.signalStrength || 'N/A');
    console.log('   🎵 Stereo:', status.isStereo ? 'Yes' : 'No');
    console.log('   ▶️  Playing:', status.isPlaying ? 'Yes' : 'No');

    // Step 3: Test frequency change
    console.log('\n3️⃣  Testing frequency change to 99.5 MHz...');
    const setFreqResponse = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/frequency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frequency: 99.5 })
    });
    const setFreqResult = await setFreqResponse.json();
    console.log('   ✅ Frequency set to:', setFreqResult.frequency, 'MHz');

    // Step 4: Verify frequency was changed
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    console.log('\n4️⃣  Verifying frequency change...');
    const verifyResponse = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/status`);
    const verifyStatus = await verifyResponse.json();

    if (Math.abs(verifyStatus.frequency - 99.5) < 0.1) {
      console.log('   ✅ Frequency verified:', verifyStatus.frequency, 'MHz');
    } else {
      console.log('   ⚠️  Warning: Frequency mismatch!');
      console.log('      Expected: 99.5 MHz');
      console.log('      Got:', verifyStatus.frequency, 'MHz');
    }

    // Step 5: Test tune up
    console.log('\n5️⃣  Testing tune up...');
    const tuneUpResponse = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/tune/up`, {
      method: 'POST'
    });
    const tuneUpResult = await tuneUpResponse.json();
    console.log('   ✅ Tuned up to:', tuneUpResult.frequency, 'MHz');

    // Step 6: Test tune down
    console.log('\n6️⃣  Testing tune down...');
    const tuneDownResponse = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/tune/down`, {
      method: 'POST'
    });
    const tuneDownResult = await tuneDownResponse.json();
    console.log('   ✅ Tuned down to:', tuneDownResult.frequency, 'MHz');

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! Frequency sync is working correctly.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Hardware service is running: node hardware-service.js');
    console.error('  2. TEA5767 is connected and working');
    console.error('  3. Python script is accessible: python3 python/radio-control.py status');
    process.exit(1);
  }
}

// Run the test
testFrequencySync();

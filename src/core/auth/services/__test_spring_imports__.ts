// Test import paths for Spring API
// This file tests if the generated Spring API can be imported correctly

try {
  // Test relative path
  const springApi = require('../../../api/generated/spring');
  console.log('✅ Relative path works:', Object.keys(springApi).slice(0, 5));
} catch (error) {
  console.log('❌ Relative path failed:', error.message);
}

try {
  // Test path alias
  const springApi = require('@/core/api/generated/spring');
  console.log('✅ Path alias works:', Object.keys(springApi).slice(0, 5));
} catch (error) {
  console.log('❌ Path alias failed:', error.message);
}

export {};

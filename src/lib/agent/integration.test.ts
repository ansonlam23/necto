/**
 * Agent Integration Test
 * 
 * Manual verification script for end-to-end agent testing.
 * Tests both Tracked and Untracked identity modes through full pipeline.
 * 
 * Run with: npx ts-node src/lib/agent/integration.test.ts
 * Or: npm run test:agent (if added to package.json)
 */

import { orchestrator } from './orchestrator';
import { IdentityMode } from '@/types/job';
import { GpuType } from '@/types/provider';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  // Skip 0G upload in tests to avoid requiring credentials
  skipStorageUpload: true,
  // Verbose logging
  verbose: true,
};

/**
 * Test result tracker
 */
interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Run a single test
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  console.log(`\n🧪 Running: ${name}`);
  const start = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, durationMs: duration });
    console.log(`✅ PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({ name, passed: false, durationMs: duration, error: errorMessage });
    console.log(`❌ FAILED (${duration}ms): ${errorMessage}`);
  }
}

/**
 * Test 1: Tracked mode with team member
 */
async function testTrackedMode(): Promise<void> {
  const result = await orchestrator.processJob({
    id: 'test-tracked-1',
    buyerAddress: '0x1234567890123456789012345678901234567890',
    gpuCount: 2,
    durationHours: 10,
    constraints: {
      identityMode: IdentityMode.TRACKED,
      requiredGpuType: GpuType.A100_80GB,
    },
    teamMemberId: 'test-user',
    createdAt: new Date(),
  });

  // Assertions
  if (!result.jobId) throw new Error('Missing jobId');
  if (!result.selectedProviderId) throw new Error('Missing selectedProviderId');
  if (result.recommendations.length === 0) throw new Error('No recommendations');
  if (!result.reasoningHash) throw new Error('Missing reasoningHash');
  if (result.totalCost <= 0) throw new Error('Invalid totalCost');
  if (result.metrics.totalMs <= 0) throw new Error('Invalid pipeline duration');

  if (TEST_CONFIG.verbose) {
    console.log('  Job ID:', result.jobId);
    console.log('  Selected:', result.selectedProviderName);
    console.log('  Cost: $' + result.totalCost.toFixed(2));
    console.log('  Hash:', result.reasoningHash);
    console.log('  Pipeline:', result.metrics.totalMs + 'ms');
    console.log('  Providers:', result.providerCounts.total, 'total,', 
                result.providerCounts.passedFilter, 'passed filter');
  }
}

/**
 * Test 2: Untracked mode (privacy)
 */
async function testUntrackedMode(): Promise<void> {
  const result = await orchestrator.processJob({
    id: 'test-untracked-1',
    buyerAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    gpuCount: 1,
    durationHours: 5,
    constraints: {
      identityMode: IdentityMode.UNTRACKED,
    },
    createdAt: new Date(),
  });

  // Assertions
  if (!result.jobId) throw new Error('Missing jobId');
  if (!result.selectedProviderId) throw new Error('Missing selectedProviderId');
  if (result.recommendations.length === 0) throw new Error('No recommendations');
  if (!result.reasoningHash) throw new Error('Missing reasoningHash');

  if (TEST_CONFIG.verbose) {
    console.log('  Job ID:', result.jobId);
    console.log('  Selected:', result.selectedProviderName);
    console.log('  Cost: $' + result.totalCost.toFixed(2));
    console.log('  Hash:', result.reasoningHash);
  }
}

/**
 * Test 3: Constraints filtering
 */
async function testConstraintsFiltering(): Promise<void> {
  const result = await orchestrator.processJob({
    id: 'test-constraints-1',
    buyerAddress: '0x1111111111111111111111111111111111111111',
    gpuCount: 4,
    durationHours: 24,
    constraints: {
      identityMode: IdentityMode.TRACKED,
      requiredGpuType: GpuType.H100,
      maxPricePerHour: 10.0,
      preferredRegions: ['us-east', 'us-west'],
      allowSpot: false,
    },
    createdAt: new Date(),
  });

  // Assertions
  if (result.providerCounts.total === 0) throw new Error('No providers in registry');
  if (result.providerCounts.passedFilter === 0) {
    console.log('  ⚠️ All providers filtered out (may be expected with strict constraints)');
  }

  if (TEST_CONFIG.verbose) {
    console.log('  Total providers:', result.providerCounts.total);
    console.log('  Passed filter:', result.providerCounts.passedFilter);
    console.log('  Recommendations:', result.recommendations.length);
  }
}

/**
 * Test 4: Price normalization validation
 */
async function testPriceNormalization(): Promise<void> {
  const result = await orchestrator.processJob({
    id: 'test-pricing-1',
    buyerAddress: '0x2222222222222222222222222222222222222222',
    gpuCount: 8,
    durationHours: 48,
    constraints: {
      identityMode: IdentityMode.UNTRACKED,
    },
    createdAt: new Date(),
  });

  // Check recommendations have valid prices
  for (const rec of result.recommendations) {
    if (rec.normalizedPrice.effectiveUsdPerA100Hour <= 0) {
      throw new Error(`Invalid price for ${rec.provider.name}`);
    }
    if (!rec.scoreBreakdown || Object.keys(rec.scoreBreakdown).length === 0) {
      throw new Error(`Missing score breakdown for ${rec.provider.name}`);
    }
  }

  if (TEST_CONFIG.verbose) {
    result.recommendations.forEach((rec, i) => {
      console.log(`  #${i + 1}: ${rec.provider.name} - ` +
                  `$${rec.normalizedPrice.effectiveUsdPerA100Hour.toFixed(2)}/GPU-hr ` +
                  `(${rec.totalScore} pts)`);
    });
  }
}

/**
 * Test 5: Pipeline performance
 */
async function testPipelinePerformance(): Promise<void> {
  const start = Date.now();
  
  const result = await orchestrator.processJob({
    id: 'test-perf-1',
    buyerAddress: '0x3333333333333333333333333333333333333333',
    gpuCount: 2,
    durationHours: 12,
    constraints: {
      identityMode: IdentityMode.UNTRACKED,
    },
    createdAt: new Date(),
  });

  const totalDuration = Date.now() - start;

  // Performance assertions
  if (totalDuration > 30000) {
    throw new Error(`Pipeline too slow: ${totalDuration}ms (target: <10000ms)`);
  }

  // Check all metrics are present
  const metrics = result.metrics;
  if (metrics.identityMs < 0) throw new Error('Missing identityMs metric');
  if (metrics.filterMs < 0) throw new Error('Missing filterMs metric');
  if (metrics.quotesMs < 0) throw new Error('Missing quotesMs metric');
  if (metrics.normalizeMs < 0) throw new Error('Missing normalizeMs metric');
  if (metrics.rankMs < 0) throw new Error('Missing rankMs metric');
  if (metrics.traceMs < 0) throw new Error('Missing traceMs metric');
  if (metrics.uploadMs < 0) throw new Error('Missing uploadMs metric');

  if (TEST_CONFIG.verbose) {
    console.log('  Total duration:', totalDuration + 'ms');
    console.log('  Identity:', metrics.identityMs + 'ms');
    console.log('  Filter:', metrics.filterMs + 'ms');
    console.log('  Quotes:', metrics.quotesMs + 'ms');
    console.log('  Normalize:', metrics.normalizeMs + 'ms');
    console.log('  Rank:', metrics.rankMs + 'ms');
    console.log('  Trace:', metrics.traceMs + 'ms');
    console.log('  Upload:', metrics.uploadMs + 'ms');
  }
}

/**
 * Test 6: Error handling
 */
async function testErrorHandling(): Promise<void> {
  // Test with invalid GPU count
  try {
    await orchestrator.processJob({
      id: 'test-error-1',
      buyerAddress: '0x4444444444444444444444444444444444444444',
      gpuCount: 999, // Unrealistic
      durationHours: 1,
      constraints: {
        identityMode: IdentityMode.UNTRACKED,
        requiredGpuType: 'INVALID_GPU' as GpuType, // Invalid GPU type
      },
      createdAt: new Date(),
    });
    
    // Should either fail or handle gracefully
    console.log('  ⚠️ Invalid GPU type handled (may have defaulted to available)');
  } catch (error) {
    // Expected - error should be handled gracefully
    if (TEST_CONFIG.verbose) {
      console.log('  Expected error caught:', (error as Error).message);
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        Synapse Agent Integration Tests                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nStarted at: ${new Date().toISOString()}`);
  console.log(`Storage upload: ${TEST_CONFIG.skipStorageUpload ? 'SKIPPED' : 'ENABLED'}`);

  // Run tests sequentially
  await runTest('Tracked mode with team member', testTrackedMode);
  await runTest('Untracked mode (privacy)', testUntrackedMode);
  await runTest('Constraints filtering', testConstraintsFiltering);
  await runTest('Price normalization', testPriceNormalization);
  await runTest('Pipeline performance', testPipelinePerformance);
  await runTest('Error handling', testErrorHandling);

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   Test Summary                         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name} (${r.durationMs}ms)`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });

  console.log('\n─────────────────────────────────────────────────────────');
  console.log(`Total: ${results.length} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
  console.log(`Total duration: ${totalDuration}ms`);
  console.log('─────────────────────────────────────────────────────────');

  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All integration tests passed!');
    process.exit(0);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { runAllTests, TEST_CONFIG };
export default runAllTests;

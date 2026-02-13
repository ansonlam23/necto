import hre from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

const { ethers } = hre

/**
 * @title Verify Script
 * @dev Verifies deployment by testing contract functionality
 */

async function verifyDeployment() {
  console.log('Verifying deployment...\n')

  // Load deployment info
  const network = await ethers.provider.getNetwork()
  const networkName = network.chainId.toString() === '16602' ? '0g-testnet' :
                      network.chainId.toString() === '31337' ? 'hardhat' :
                      network.name || 'unknown'

  const deploymentPath = path.join(__dirname, '..', 'deployments', `${networkName}.json`)

  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ Deployment info not found at:', deploymentPath)
    console.error('Please run deploy.ts first')
    process.exit(1)
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
  console.log('Deployment loaded from:', deploymentPath)
  console.log('Network:', deploymentInfo.network)
  console.log('Chain ID:', deploymentInfo.chainId)
  console.log('Deployed at:', deploymentInfo.timestamp)
  console.log('')

  const [signer] = await ethers.getSigners()
  console.log('Using signer:', signer.address)

  // Get contract instances
  const router = await ethers.getContractAt('ComputeRouter', deploymentInfo.contracts.ComputeRouter)
  const usdc = await ethers.getContractAt('MockUSDC', deploymentInfo.contracts.MockUSDC || deploymentInfo.contracts.USDC)

  console.log('\n--- Test 1: Register Provider ---')
  try {
    const metadataURI = 'https://example.com/provider-metadata'
    const tx1 = await router.registerProvider(metadataURI)
    await tx1.wait()
    console.log('✓ Provider registered with metadata:', metadataURI)

    // Verify provider was registered
    const providerInfo = await router.getProvider(signer.address)
    console.log('  Provider active:', providerInfo.isActive)
    console.log('  Provider metadata:', providerInfo.metadataURI)
  } catch (error: any) {
    console.log('⚠️  Provider registration failed (may already be registered):', error.message)
  }

  console.log('\n--- Test 2: Approve USDC for Job Creation ---')
  try {
    const approvalAmount = ethers.parseUnits('1000', 6) // 1000 USDC
    const tx2 = await usdc.approve(deploymentInfo.contracts.ComputeRouter, approvalAmount)
    await tx2.wait()
    console.log('✓ Approved', ethers.formatUnits(approvalAmount, 6), 'USDC for ComputeRouter')

    // Verify allowance
    const allowance = await usdc.allowance(signer.address, deploymentInfo.contracts.ComputeRouter)
    console.log('  Allowance:', ethers.formatUnits(allowance, 6), 'USDC')
  } catch (error: any) {
    console.log('❌ USDC approval failed:', error.message)
  }

  console.log('\n--- Test 3: Create Job ---')
  try {
    const jobAmount = ethers.parseUnits('10', 6) // 10 USDC
    const reasoningHash = '0x' + '1234'.padEnd(64, '0')

    const tx3 = await router.createJob(
      signer.address, // provider (using self as provider for testing)
      true, // tracked mode
      reasoningHash,
      jobAmount
    )
    const receipt = await tx3.wait()
    console.log('✓ Job created')
    console.log('  Transaction:', receipt?.hash)

    // Extract jobId from event
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = router.interface.parseLog(log)
        return parsed?.name === 'JobCreated'
      } catch {
        return false
      }
    })

    if (event) {
      const parsedEvent = router.interface.parseLog(event)
      const jobId = parsedEvent?.args[0]
      console.log('  Job ID:', jobId)

      // Get job details
      const jobDetails = await router.getJob(jobId)
      console.log('  Job buyer:', jobDetails.buyer)
      console.log('  Job provider:', jobDetails.provider)
      console.log('  Job amount:', ethers.formatUnits(jobDetails.amount, 6), 'USDC')
      console.log('  Job tracked:', jobDetails.tracked)
      console.log('  Job status:', jobDetails.status)
    }
  } catch (error: any) {
    console.log('❌ Job creation failed:', error.message)
  }

  console.log('\n--- Test 4: Check Escrow Status ---')
  try {
    // Get all jobs for signer
    const jobCount = await router.getJobCount(signer.address)
    console.log('Total jobs for signer:', jobCount.toString())

    if (jobCount > 0n) {
      // Get the latest job
      // Note: This depends on the contract having a method to get job by index
      // If not available, we'd need to track job IDs from events
      console.log('✓ Jobs exist in system')
    }
  } catch (error: any) {
    console.log('⚠️  Could not check job count:', error.message)
  }

  console.log('\n--- Test 5: Check Contract Ownership ---')
  try {
    const owner = await router.owner()
    console.log('✓ ComputeRouter owner:', owner)

    // Check child contracts
    const providerRegistry = await ethers.getContractAt('ProviderRegistry', deploymentInfo.contracts.ProviderRegistry)
    const registryOwner = await providerRegistry.owner()
    console.log('  ProviderRegistry owner:', registryOwner)
  } catch (error: any) {
    console.log('⚠️  Could not check ownership:', error.message)
  }

  console.log('\n✅ Verification complete!')
  console.log('\nDeployed Contracts:')
  console.log('  ComputeRouter:', deploymentInfo.contracts.ComputeRouter)
  console.log('  ProviderRegistry:', deploymentInfo.contracts.ProviderRegistry)
  console.log('  JobRegistry:', deploymentInfo.contracts.JobRegistry)
  console.log('  Escrow:', deploymentInfo.contracts.Escrow)
  console.log('  USDC:', deploymentInfo.contracts.USDC)
  if (deploymentInfo.contracts.MockUSDC) {
    console.log('  MockUSDC:', deploymentInfo.contracts.MockUSDC)
  }

  console.log('\nExplorer Links:')
  if (network.chainId.toString() === '16602') {
    console.log('  https://chainscan-galileo.0g.ai/address/' + deploymentInfo.contracts.ComputeRouter)
  }
}

verifyDeployment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

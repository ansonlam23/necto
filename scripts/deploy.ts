import hre from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

const { ethers } = hre

/**
 * @title Deploy Script
 * @dev Deploys ComputeRouter and dependencies to ADI Testnet
 * If USDC doesn't exist on testnet, deploys a MockERC20 for testing
 */

async function deployContracts() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)
  console.log('Account balance:', (await deployer.provider.getBalance(deployer.address)).toString())

  const network = await ethers.provider.getNetwork()
  console.log('Network:', network.name, 'Chain ID:', network.chainId.toString())

  let usdcAddress: string
  let mockUSDC: any

  // Check if we should deploy MockUSDC or use existing
  const useMockUSDC = process.env.USE_MOCK_USDC === 'true' || network.chainId.toString() === '31337'

  if (useMockUSDC) {
    console.log('\n--- Deploying MockUSDC ---')
    const MockUSDC = await ethers.getContractFactory('MockUSDC')
    mockUSDC = await MockUSDC.deploy()
    await mockUSDC.waitForDeployment()
    usdcAddress = await mockUSDC.getAddress()
    console.log('MockUSDC deployed to:', usdcAddress)

    // Mint some test tokens to deployer
    const mintAmount = ethers.parseUnits('1000000', 6) // 1M USDC
    await mockUSDC.mint(deployer.address, mintAmount)
    console.log('Minted 1,000,000 MockUSDC to deployer')
  } else {
    // Use existing USDC on testnet
    usdcAddress = process.env.USDC_ADDRESS || ''
    if (!usdcAddress) {
      console.warn('⚠️  No USDC_ADDRESS set in environment. Using deployer address as placeholder.')
      console.warn('⚠️  You will need to update the deployment config with actual USDC address.')
      usdcAddress = deployer.address // Placeholder
    }
    console.log('Using existing USDC at:', usdcAddress)
  }

  console.log('\n--- Deploying ComputeRouter ---')
  const ComputeRouter = await ethers.getContractFactory('ComputeRouter')
  const computeRouter = await ComputeRouter.deploy(usdcAddress, deployer.address)
  await computeRouter.waitForDeployment()

  const routerAddress = await computeRouter.getAddress()
  console.log('ComputeRouter deployed to:', routerAddress)

  // Get child contract addresses
  const providerRegistryAddress = await computeRouter.providerRegistry()
  const jobRegistryAddress = await computeRouter.jobRegistry()
  const escrowAddress = await computeRouter.escrow()

  console.log('\n--- Child Contracts ---')
  console.log('ProviderRegistry:', providerRegistryAddress)
  console.log('JobRegistry:', jobRegistryAddress)
  console.log('Escrow:', escrowAddress)

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ComputeRouter: routerAddress,
      ProviderRegistry: providerRegistryAddress,
      JobRegistry: jobRegistryAddress,
      Escrow: escrowAddress,
      USDC: usdcAddress,
      MockUSDC: mockUSDC ? await mockUSDC.getAddress() : null
    }
  }

  // Ensure deployments directory exists
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true })
  }

  // Save to network-specific file
  const networkName = network.chainId.toString() === '16602' ? '0g-testnet' :
                      network.chainId.toString() === '31337' ? 'hardhat' :
                      network.name || 'unknown'

  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`)
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2))
  console.log('\n✅ Deployment info saved to:', deploymentPath)

  // Also save to src/types/contracts.ts for frontend
  const typesDir = path.join(__dirname, '..', 'src', 'types')
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true })
  }

  const contractAddressesContent = `
// Auto-generated from deployment
// Network: ${networkName}
// Timestamp: ${deploymentInfo.timestamp}

export const CONTRACT_ADDRESSES = {
  ${networkName}: {
    ComputeRouter: "${routerAddress}",
    ProviderRegistry: "${providerRegistryAddress}",
    JobRegistry: "${jobRegistryAddress}",
    Escrow: "${escrowAddress}",
    USDC: "${usdcAddress}",
  }
} as const;

export type SupportedNetwork = keyof typeof CONTRACT_ADDRESSES;
`

  fs.writeFileSync(path.join(typesDir, 'contract-addresses.ts'), contractAddressesContent)
  console.log('✅ Contract addresses saved to src/types/contract-addresses.ts')

  console.log('\n--- Deployment Complete ---')
  console.log('To verify contracts on explorer (if supported):')
  console.log(`npx hardhat verify --network ${networkName} ${routerAddress} ${usdcAddress} ${deployer.address}`)

  return deploymentInfo
}

deployContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

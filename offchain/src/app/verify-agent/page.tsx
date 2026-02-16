'use client'

import * as React from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Wallet, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Activity,
  FileSearch,
  Send,
  Loader2
} from 'lucide-react'
import { keccak256, toHex } from 'viem'
import { COMPUTE_ROUTER_ADDRESS } from '@/lib/contracts/compute-router'
import { adiTestnet } from '@/lib/adi-chain'

export default function VerifyAgentPage() {
  const { 
    address, 
    isConnected, 
    chainId, 
    connect, 
    signTransaction, 
    readContract 
  } = useWallet()
  
  const [readResult, setReadResult] = React.useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    data?: unknown
    error?: string
  }>({ status: 'idle' })
  
  const [writeResult, setWriteResult] = React.useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    hash?: string
    error?: string
  }>({ status: 'idle' })

  const isOnAdiTestnet = chainId === adiTestnet.id
  const isContractConfigured = COMPUTE_ROUTER_ADDRESS && COMPUTE_ROUTER_ADDRESS.length > 0

  const handleTestRead = async () => {
    setReadResult({ status: 'loading' })
    
    try {
      if (!isContractConfigured) {
        throw new Error('Contract not deployed yet - COMPUTE_ROUTER_ADDRESS is empty')
      }
      
      const result = await readContract('getJob', [BigInt(0)])
      setReadResult({ 
        status: 'success', 
        data: result,
        error: undefined
      })
    } catch (error) {
      console.error('Read test failed:', error)
      setReadResult({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: undefined
      })
    }
  }

  const handleTestWrite = async () => {
    setWriteResult({ status: 'loading' })
    
    try {
      if (!isContractConfigured) {
        throw new Error('Contract not deployed yet - COMPUTE_ROUTER_ADDRESS is empty')
      }
      
      if (!address) {
        throw new Error('Wallet not connected')
      }
      
      // Create test job submission
      const detailsHash = keccak256(toHex('test-job'))
      
      const hash = await signTransaction('submitJob', [
        address,
        detailsHash,
        false, // isTracked
      ])
      
      setWriteResult({ 
        status: 'success', 
        hash,
        error: undefined
      })
    } catch (error) {
      console.error('Write test failed:', error)
      setWriteResult({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        hash: undefined
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Agent Verification
        </h1>
        <p className="text-muted-foreground mt-2">
          Verify wallet connection and transaction signing capabilities on ADI Testnet.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current wallet connection state and network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Connected</AlertTitle>
              <AlertDescription>
                Please connect your wallet to proceed with verification.
                <div className="mt-2">
                  <Button onClick={connect} size="sm">
                    Connect Wallet
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="font-mono text-sm break-all">{address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Chain ID</p>
                  <p className="font-mono">{chainId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Network</p>
                  <Badge variant={isOnAdiTestnet ? 'default' : 'destructive'}>
                    {isOnAdiTestnet ? 'ADI Testnet ✓' : 'Wrong Network'}
                  </Badge>
                </div>
              </div>
              
              {!isOnAdiTestnet && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wrong Network</AlertTitle>
                  <AlertDescription>
                    Please switch to ADI Testnet (Chain ID: {adiTestnet.id}) to use the ComputeRouter.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Contract Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Contract Status
          </CardTitle>
          <CardDescription>
            ComputeRouter deployment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isContractConfigured ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Contract Not Deployed</AlertTitle>
              <AlertDescription>
                COMPUTE_ROUTER_ADDRESS is empty. This is expected if the contract hasn&apos;t been deployed to ADI Testnet yet.
                <br /><br />
                <strong>Expected behavior:</strong> Read and write tests will fail until the contract is deployed and the address is configured in <code>offchain/src/lib/contracts/compute-router.ts</code>.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Contract Address</p>
              <p className="font-mono text-sm">{COMPUTE_ROUTER_ADDRESS}</p>
              <Badge variant="default">Configured ✓</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Read Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Read Test
          </CardTitle>
          <CardDescription>
            Test reading from the ComputeRouter contract (getJob with jobId 0)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTestRead}
            disabled={!isConnected || readResult.status === 'loading'}
            className="w-full md:w-auto"
          >
            {readResult.status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reading...
              </>
            ) : (
              <>
                <FileSearch className="mr-2 h-4 w-4" />
                Test Read Contract
              </>
            )}
          </Button>

          {readResult.status === 'success' && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Read Successful</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-muted rounded">
                  {JSON.stringify(readResult.data, (_, v) => 
                    typeof v === 'bigint' ? v.toString() : v, 2
                  )}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          {readResult.status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Read Failed</AlertTitle>
              <AlertDescription>
                {readResult.error}
                <p className="mt-2 text-sm text-muted-foreground">
                  This is expected if the contract is not deployed. Deploy the contract and update COMPUTE_ROUTER_ADDRESS to enable reads.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Write Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Write Test
          </CardTitle>
          <CardDescription>
            Test transaction signing by submitting a test job to the ComputeRouter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTestWrite}
            disabled={!isConnected || !isOnAdiTestnet || writeResult.status === 'loading'}
            className="w-full md:w-auto"
          >
            {writeResult.status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Test Sign Transaction
              </>
            )}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground">
              Connect wallet to enable transaction signing test
            </p>
          )}

          {isConnected && !isOnAdiTestnet && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wrong Network</AlertTitle>
              <AlertDescription>
                Switch to ADI Testnet to test transaction signing.
              </AlertDescription>
            </Alert>
          )}

          {writeResult.status === 'success' && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Transaction Submitted</AlertTitle>
              <AlertDescription>
                <p className="text-sm">Transaction Hash:</p>
                <p className="font-mono text-xs break-all mt-1">{writeResult.hash}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  The transaction has been submitted to ADI Testnet.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {writeResult.status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Transaction Failed</AlertTitle>
              <AlertDescription>
                {writeResult.error}
                <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Check that you have ADI testnet tokens in your wallet</li>
                  <li>Verify the ComputeRouter contract is deployed</li>
                  <li>Ensure COMPUTE_ROUTER_ADDRESS is correctly configured</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">About This Verification</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Connection: Verifies wallet can connect and identify ADI Testnet</li>
          <li>• Read Test: Calls getJob(0) - expected to fail if job 0 doesn&apos;t exist</li>
          <li>• Write Test: Submits a test job - requires ADI tokens for gas</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3">
          <strong>Expected behavior before deployment:</strong> Connection should work, but read/write tests will fail until the ComputeRouter is deployed and funded.
        </p>
      </div>
    </div>
  )
}

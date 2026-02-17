'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Brain,
  Cpu,
  DollarSign,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  Activity,
  Link,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import type { ThinkingStep, RoutingResult, TransactionResult } from '@/lib/agent/types'

interface FormData {
  description: string
  gpuModel: string
  maxPrice: string
  minGpuCount: string
  region: string
  isTracked: boolean
}

const GPU_MODELS = ['Any', 'A100', 'H100', 'RTX4090', 'RTX3090', 'V100']

const BLOCK_EXPLORER_URL = 'https://explorer.ab.testnet.adifoundation.ai'

function ThinkingStepItem({ step }: { step: ThinkingStep }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {step.status === 'active' && (
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
        )}
        {step.status === 'complete' && (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        )}
        {step.status === 'error' && (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        {step.status === 'pending' && (
          <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{step.message}</p>
        <p className="text-xs text-slate-500 terminal-data mt-0.5">
          {new Date(step.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

export default function VerifyAgentPage() {
  const [formData, setFormData] = React.useState<FormData>({
    description: '',
    gpuModel: 'Any',
    maxPrice: '',
    minGpuCount: '',
    region: '',
    isTracked: false,
  })
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([])
  const [visibleSteps, setVisibleSteps] = React.useState<ThinkingStep[]>([])
  const [result, setResult] = React.useState<RoutingResult | null>(null)
  const [transaction, setTransaction] = React.useState<TransactionResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [copiedHash, setCopiedHash] = React.useState(false)

  const revealStepsSequentially = React.useCallback((steps: ThinkingStep[]) => {
    steps.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
      }, index * 500)
    })
  }, [])

  const handleCopyHash = React.useCallback((hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)
    setTransaction(null)
    setThinkingSteps([])
    setVisibleSteps([])

    try {
      const body = {
        description: formData.description.trim(),
        requirements: {
          ...(formData.gpuModel !== 'Any' && { gpuModel: formData.gpuModel }),
          ...(formData.maxPrice && { maxPricePerHour: parseFloat(formData.maxPrice) }),
          ...(formData.minGpuCount && { minGpuCount: parseInt(formData.minGpuCount, 10) }),
          ...(formData.region.trim() && { region: formData.region.trim() }),
        },
        isTracked: formData.isTracked,
        userAddress: '0x0000000000000000000000000000000000000000',
      }

      const response = await fetch('/api/route-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Unknown error from agent')
        return
      }

      const steps: ThinkingStep[] = data.thinkingSteps || []
      setThinkingSteps(steps)
      revealStepsSequentially(steps)

      // Delay result reveal to let steps animate first
      setTimeout(() => {
        setResult(data.result)
        setTransaction(data.transaction || null)
      }, steps.length * 500 + 300)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — check console')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          Agent Router Demo
        </h1>
        <p className="text-muted-foreground mt-2">
          Submit compute job requirements. The agent fetches live Akash providers,
          filters and ranks them, then selects the best match with reasoning.
        </p>
      </div>

      {/* Job Submission Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Job Requirements
          </CardTitle>
          <CardDescription>
            Describe your compute workload and hardware constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Input
                id="description"
                placeholder="e.g. Train a BERT model on custom dataset"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gpuModel">GPU Model</Label>
                <Select
                  value={formData.gpuModel}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, gpuModel: value }))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="gpuModel">
                    <SelectValue placeholder="Select GPU" />
                  </SelectTrigger>
                  <SelectContent>
                    {GPU_MODELS.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Price ($/hr)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 3.00"
                  value={formData.maxPrice}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, maxPrice: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minGpuCount">Min GPU Count</Label>
                <Input
                  id="minGpuCount"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 1"
                  value={formData.minGpuCount}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, minGpuCount: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region (optional)</Label>
                <Input
                  id="region"
                  placeholder="e.g. US"
                  value={formData.region}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, region: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Blockchain Tracking Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="track-blockchain" className="text-sm font-medium">
                  Track on Blockchain
                </Label>
                <p className="text-xs text-muted-foreground">
                  Publish routing result to ADI Testnet
                </p>
              </div>
              <Switch
                id="track-blockchain"
                checked={formData.isTracked}
                onCheckedChange={(checked: boolean) =>
                  setFormData(prev => ({ ...prev, isTracked: checked }))
                }
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.description.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Routing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Route Job
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Routing Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Thinking Steps */}
      {visibleSteps.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-400" />
              Agent Thinking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-l-2 border-slate-700 pl-4 space-y-4">
              {visibleSteps.map(step => (
                <ThinkingStepItem key={`${step.id}-${step.status}`} step={step} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Card */}
      {result && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Routing Decision
            </CardTitle>
            <CardDescription>
              Agent selected the optimal provider for your workload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{result.provider.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">{result.provider.source}</Badge>
                  {result.provider.region && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {result.provider.region}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xl terminal-data">
                  <DollarSign className="h-5 w-5" />
                  {result.provider.priceEstimate.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/hr</span>
                </div>
                <div className="text-sm text-muted-foreground mt-0.5 terminal-data">
                  {result.provider.uptimePercentage}% uptime
                </div>
              </div>
            </div>

            <Separator />

            {/* Hardware */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Cpu className="h-4 w-4" />
                Hardware
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">GPU Model</p>
                  <p className="text-sm font-medium terminal-data">
                    {result.provider.hardware.gpuModel}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GPU Count</p>
                  <p className="text-sm font-medium terminal-data">
                    {result.provider.hardware.gpuCount}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Brain className="h-4 w-4" />
                Agent Reasoning
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{result.reasoning}</p>
            </div>

            {/* Blockchain Transaction */}
            {formData.isTracked && transaction && (
              <>
                <Separator />

                <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Link className="h-4 w-4" />
                      Blockchain Transaction
                    </h4>
                    <Badge
                      variant="outline"
                      className={
                        transaction.success
                          ? 'border-emerald-500/50 text-emerald-400'
                          : 'border-red-500/50 text-red-400'
                      }
                    >
                      {transaction.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>

                  {transaction.success ? (
                    <div className="space-y-3">
                      {/* Transaction Hash */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-slate-800 px-2 py-1 rounded break-all flex-1 terminal-data">
                            {transaction.hash}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleCopyHash(transaction.hash || '')}
                          >
                            {copiedHash ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            asChild
                          >
                            <a
                              href={`${BLOCK_EXPLORER_URL}/tx/${transaction.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>

                      {/* Job ID */}
                      {transaction.jobId !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Job ID</p>
                          <p className="text-sm font-medium terminal-data">
                            Job #{transaction.jobId.toString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Transaction Failed */
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Error</p>
                      <p className="text-sm text-red-400">{transaction.error}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Confidence */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-sm text-muted-foreground">Confidence Score</span>
              <Badge
                variant="outline"
                className="terminal-data border-emerald-500/50 text-emerald-400"
              >
                {Math.round(result.confidence * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

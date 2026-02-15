import { Suspense } from 'react'
import { fetchAkashProviders, type SynapseProvider } from '@/lib/providers/akash-fetcher'
import { fetchLambdaProviders } from '@/lib/providers/lambda-fetcher'
import { fetchRunPodProviders } from '@/lib/providers/runpod-fetcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Server, Gpu, Cpu, HardDrive, MapPin, Activity } from 'lucide-react'

function ProviderCard({ provider }: { provider: SynapseProvider }) {
  // Format CPU from milli-units to vCPUs
  const vCpu = (provider.hardware.cpuUnits / 1000).toFixed(0);
  // Format memory to GB with 1 decimal
  const memoryGB = (provider.hardware.memory / 1024 / 1024 / 1024).toFixed(1);

  return (
    <Card className="h-full min-h-[240px] flex flex-col hover:shadow-lg transition-shadow relative">
      {/* Absolute positioned badges - stacked vertically */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        <Badge
          variant={
            provider.uptimePercentage >= 99 ? "default" :
            provider.uptimePercentage >= 95 ? "secondary" :
            "destructive"
          }
          className="text-[10px] px-1.5 py-0.5 flex items-center gap-1"
        >
          <Activity className={`h-2.5 w-2.5 ${
            provider.uptimePercentage >= 99 ? 'text-green-500' :
            provider.uptimePercentage >= 95 ? 'text-yellow-500' :
            provider.uptimePercentage >= 90 ? 'text-orange-500' :
            'text-red-500'
          }`} />
          {provider.uptimePercentage.toFixed(1)}%
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
          {provider.source}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between pr-16">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle
              className="text-sm font-medium truncate max-w-[180px]"
              title={provider.name}
            >
              {provider.name}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-[10px] mt-1">
          ID: {provider.id.slice(0, 8)}...{provider.id.slice(-6)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        {/* Hardware Specs - GPU as hero element */}
        <div className="space-y-3">
          {/* GPU Model - Primary focus */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gpu className="h-5 w-5 text-green-500" />
              <span className="font-bold text-base">{provider.hardware.gpuModel}</span>
            </div>
            <Badge variant="outline" className="text-[10px] w-fit">
              {provider.hardware.gpuCount}x GPU
            </Badge>
          </div>

          {/* CPU/Memory - Secondary info */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>{vCpu} vCPU</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>{memoryGB} GB</span>
            </div>
          </div>
        </div>

        {/* Location & Pricing */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {provider.region ? (
              <>
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[100px]" title={provider.region}>
                  {provider.region}
                </span>
              </>
            ) : (
              <span className="text-gray-400">Location unknown</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-green-600">
              ${provider.priceEstimate.toFixed(2)}/hr
            </div>
            <div className="text-[10px] text-muted-foreground">
              per GPU
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <Skeleton className="h-3 w-20" />
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function ProviderGrid() {
  // Fetch from all sources in parallel
  const [akashProviders, lambdaProviders, runpodProviders] = await Promise.all([
    fetchAkashProviders(),
    fetchLambdaProviders(),
    fetchRunPodProviders()
  ])

  // Combine all providers
  const allProviders = [...akashProviders, ...lambdaProviders, ...runpodProviders]

  if (allProviders.length === 0) {
    return (
      <div className="text-center py-12">
        <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No GPU providers found</h3>
        <p className="text-muted-foreground">
          Unable to fetch GPU providers at this time.
        </p>
      </div>
    )
  }

  // Sort providers by source (Lambda first, then RunPod, then Akash) then by price
  const sortedProviders = allProviders.sort((a, b) => {
    // Define source priority: Lambda > RunPod > Akash
    const sourcePriority = { 'Lambda': 0, 'RunPod': 1, 'Akash': 2 }
    const aPriority = sourcePriority[a.source] ?? 3
    const bPriority = sourcePriority[b.source] ?? 3

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    // If same source, sort by price
    return a.priceEstimate - b.priceEstimate
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedProviders.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  )
}

export default function ProvidersPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">GPU Providers</h1>
        <p className="text-muted-foreground">
          Discover available GPU providers from Lambda Labs, RunPod, and Akash Network
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                <Suspense fallback={<Skeleton className="h-8 w-12" />}>
                  Active Providers
                </Suspense>
              </div>
              <p className="text-xs text-muted-foreground">
                Akash Network
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Gpu className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                <Suspense fallback={<Skeleton className="h-8 w-16" />}>
                  Available GPUs
                </Suspense>
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for deployment
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <MapPin className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">Global</div>
              <p className="text-xs text-muted-foreground">
                Worldwide coverage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Providers</h2>
          <Badge variant="outline" className="text-xs">
            Real-time data from Lambda, RunPod & Akash
          </Badge>
        </div>

        <Suspense fallback={<ProviderGridSkeleton />}>
          <ProviderGrid />
        </Suspense>
      </div>
    </div>
  )
}
import { Suspense } from 'react'
import { fetchAkashProviders, type SynapseProvider } from '@/lib/providers/akash-fetcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Server, Gpu, Cpu, HardDrive, MapPin } from 'lucide-react'

function ProviderCard({ provider }: { provider: SynapseProvider }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-medium">{provider.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {provider.source}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Provider ID: {provider.id.slice(0, 12)}...{provider.id.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hardware Specs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Gpu className="h-4 w-4 text-green-500" />
            <span className="font-medium">{provider.hardware.gpuModel}</span>
            <Badge variant="outline" className="text-xs">
              {provider.hardware.gpuCount}x GPU
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>{provider.hardware.cpuUnits} CPU</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>{(provider.hardware.memory / 1024 / 1024 / 1024).toFixed(1)} GB</span>
            </div>
          </div>
        </div>

        {/* Location & Pricing */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {provider.region && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{provider.region}</span>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600">
              ${provider.priceEstimate.toFixed(2)}/hr
            </div>
            <div className="text-xs text-muted-foreground">
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
  const providers = await fetchAkashProviders()

  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No GPU providers found</h3>
        <p className="text-muted-foreground">
          Unable to fetch active GPU providers from Akash Network at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
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
          Discover available GPU providers across decentralized networks
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
            Real-time data from Akash Console API
          </Badge>
        </div>

        <Suspense fallback={<ProviderGridSkeleton />}>
          <ProviderGrid />
        </Suspense>
      </div>
    </div>
  )
}
'use client';

import { Suspense } from 'react'
import { ProviderGrid, ProviderGridSkeleton } from './ProviderGrid'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Server, Gpu, MapPin } from 'lucide-react'


export default function ProvidersPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">GPU Providers</h1>
        <p className="text-muted-foreground">
          Discover available GPU providers from Helium, Render, and Akash Network
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
            Real-time data from multiple sources
          </Badge>
        </div>

        <ProviderGrid />
      </div>
    </div>
  )
}
'use client';

import { ProviderGrid } from './ProviderGrid'


export default function ProvidersPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Available Providers</h1>
        <p className="text-muted-foreground">
          Discover GPU providers across DePIN networks
        </p>
      </div>


      {/* Provider Grid */}
      <ProviderGrid />
    </div>
  )
}
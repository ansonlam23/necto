'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProviderComparisonView } from '@/components/akash/provider-comparison-view';
import { 
  CompareProvidersParams,
  ProviderComparison, 
  CompareProvidersResult 
} from '@/lib/agent/types/compare-providers';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles,
  Cpu,
  Globe
} from 'lucide-react';

// Client-side wrapper for the comparison API call
async function executeCompareProviders(
  params: CompareProvidersParams
): Promise<CompareProvidersResult> {
  const response = await fetch('/api/compare-providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error('Failed to compare providers');
  }
  
  return response.json();
}

export default function CompareProvidersPage(): React.JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [comparisons, setComparisons] = useState<ProviderComparison[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [requirements, setRequirements] = useState({
    gpuUnits: 1,
    gpuModel: 'nvidia',
    cpu: 4,
    memory: '8Gi',
    region: 'us-east'
  });

  const handleCompare = async () => {
    setIsLoading(true);
    try {
      const result = await executeCompareProviders({
        requirements: {
          name: 'comparison-job',
          image: 'ubuntu:22.04',
          gpu: { units: requirements.gpuUnits, model: requirements.gpuModel },
          cpu: requirements.cpu,
          memory: requirements.memory,
          region: requirements.region
        },
        providersToCompare: ['akash', 'ionet', 'lambda'],
        weights: {
          price: 0.35,
          reliability: 0.25,
          performance: 0.25,
          latency: 0.15
        }
      });

      if (result.success) {
        setComparisons(result.comparisons);
      }
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run comparison on mount
  useEffect(() => {
    handleCompare();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/buyer/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Provider Comparison</h1>
        <p className="text-muted-foreground">
          Compare compute providers side-by-side to find the best fit
        </p>
      </div>

      {/* Requirements Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Workload Requirements
          </CardTitle>
          <CardDescription>
            Adjust requirements to see how providers compare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="gpu">GPU Units</Label>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="gpu"
                  type="number"
                  min={0}
                  max={8}
                  value={requirements.gpuUnits}
                  onChange={(e) => setRequirements({
                    ...requirements,
                    gpuUnits: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpu">vCPUs</Label>
              <Input
                id="cpu"
                type="number"
                min={1}
                value={requirements.cpu}
                onChange={(e) => setRequirements({
                  ...requirements,
                  cpu: parseInt(e.target.value) || 1
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memory">Memory</Label>
              <Input
                id="memory"
                value={requirements.memory}
                onChange={(e) => setRequirements({
                  ...requirements,
                  memory: e.target.value
                })}
                placeholder="8Gi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="region"
                  value={requirements.region}
                  onChange={(e) => setRequirements({
                    ...requirements,
                    region: e.target.value
                  })}
                  placeholder="us-east"
                />
              </div>
            </div>
          </div>

          <Button 
            className="mt-4" 
            onClick={handleCompare}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Compare Providers
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Results</CardTitle>
          <CardDescription>
            Providers ranked by suitability for your workload
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ProviderComparisonView
              comparisons={comparisons}
              onSelectProvider={setSelectedProvider}
              selectedProvider={selectedProvider || undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      {selectedProvider && (
        <div className="flex justify-end">
          <Button 
            size="lg"
            onClick={() => router.push(`/buyer/submit?provider=${selectedProvider}`)}
          >
            Continue with Selected Provider
            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
          </Button>
        </div>
      )}
    </div>
  );
}

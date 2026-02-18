'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ProviderComparison } from '@/lib/agent/types/compare-providers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ProviderComparisonViewProps {
  comparisons: ProviderComparison[];
  onSelectProvider?: (provider: string) => void;
  selectedProvider?: string;
  className?: string;
}

export function ProviderComparisonView({
  comparisons,
  onSelectProvider,
  selectedProvider,
  className
}: ProviderComparisonViewProps) {
  if (comparisons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No providers available for comparison</p>
      </div>
    );
  }

  const sorted = [...comparisons].sort((a, b) => b.score - a.score);
  const recommended = sorted[0];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Recommendation Banner */}
      {recommended && recommended.suitable && (
        <Card className="border-green-500 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-green-500 text-white">
                <Star className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900">
                  Recommended: {recommended.name}
                </h3>
                <p className="text-green-800 mt-1">
                  {recommended.assessment}
                </p>
                <div className="flex gap-4 mt-3 text-sm text-green-700">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${recommended.estimatedCost.toFixed(2)}/hr
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recommended.timeToDeploy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Score: {recommended.score}/100
                  </span>
                </div>
              </div>
              <Button 
                onClick={() => onSelectProvider?.(recommended.provider)}
                disabled={selectedProvider === recommended.provider}
              >
                {selectedProvider === recommended.provider ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Selected
                  </>
                ) : (
                  'Select'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((comparison) => (
          <Card 
            key={comparison.provider}
            className={cn(
              "transition-all",
              selectedProvider === comparison.provider && "border-primary ring-2 ring-primary/20",
              comparison.suitable && comparison.provider === recommended?.provider && "border-green-500"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{comparison.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {comparison.suitable ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Suitable
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Suitable
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Score: {comparison.score}
                    </span>
                  </div>
                </div>
                {comparison.provider === recommended?.provider && comparison.suitable && (
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cost */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
                <span className="font-semibold">${comparison.estimatedCost.toFixed(2)}/hr</span>
              </div>

              {/* Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deploy Time</span>
                <span className="font-medium">{comparison.timeToDeploy}</span>
              </div>

              {/* Score bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Suitability</span>
                  <span>{comparison.score}%</span>
                </div>
                <Progress 
                  value={comparison.score} 
                  className="h-2"
                />
              </div>

              {/* Pros */}
              {comparison.pros.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Pros
                  </h4>
                  <ul className="space-y-1">
                    {comparison.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cons */}
              {comparison.cons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Cons
                  </h4>
                  <ul className="space-y-1">
                    {comparison.cons.map((con, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Assessment */}
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {comparison.assessment}
                </p>
              </div>

              {/* Select Button */}
              {comparison.suitable && (
                <Button
                  className="w-full"
                  variant={selectedProvider === comparison.provider ? "secondary" : "default"}
                  onClick={() => onSelectProvider?.(comparison.provider)}
                  disabled={selectedProvider === comparison.provider}
                >
                  {selectedProvider === comparison.provider ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    'Select Provider'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { JobRequirements } from '@/lib/akash/sdl-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings2, Cpu, MemoryStick, HardDrive, Zap, Globe, Box, AlertCircle } from 'lucide-react';

interface RequirementsFormProps {
  className?: string;
  value?: Partial<JobRequirements>;
  onChange?: (requirements: Partial<JobRequirements>) => void;
  errors?: Record<string, string>;
}

const REGIONS = [
  { value: 'us-east', label: 'US East' },
  { value: 'us-west', label: 'US West' },
  { value: 'us-central', label: 'US Central' },
  { value: 'eu-west', label: 'EU West' },
  { value: 'eu-central', label: 'EU Central' },
  { value: 'ap-south', label: 'AP South' }
];

const MEMORY_OPTIONS = ['512Mi', '1Gi', '2Gi', '4Gi', '8Gi', '16Gi', '32Gi', '64Gi'];
const STORAGE_OPTIONS = ['1Gi', '5Gi', '10Gi', '20Gi', '50Gi', '100Gi', '200Gi', '500Gi'];
const CPU_OPTIONS = ['0.5', '1', '2', '4', '8', '16'];

const GPU_MODELS = [
  { value: 'nvidia', label: 'Any NVIDIA' },
  { value: 'rtx3090', label: 'RTX 3090' },
  { value: 'rtx4090', label: 'RTX 4090' },
  { value: 'a100', label: 'A100' },
  { value: 'v100', label: 'V100' },
  { value: 'h100', label: 'H100' }
];

export function RequirementsForm({
  className,
  value = {},
  onChange,
  errors = {}
}: RequirementsFormProps) {
  const [envVars, setEnvVars] = React.useState<Array<{ key: string; value: string }>>(
    Object.entries(value.env || {}).map(([k, v]) => ({ key: k, value: v }))
  );

  const updateField = <K extends keyof JobRequirements>(
    field: K,
    fieldValue: JobRequirements[K]
  ) => {
    onChange?.({ ...value, [field]: fieldValue });
  };

  const handleEnvChange = (index: number, key: string, envValue: string) => {
    const updated = [...envVars];
    updated[index] = { key, value: envValue };
    setEnvVars(updated);

    const envObj = updated.reduce(
      (acc, { key: k, value: v }) => {
        if (k) acc[k] = v;
        return acc;
      },
      {} as Record<string, string>
    );
    updateField('env', envObj);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    const updated = envVars.filter((_, i) => i !== index);
    setEnvVars(updated);
    const envObj = updated.reduce(
      (acc, { key: k, value: v }) => {
        if (k) acc[k] = v;
        return acc;
      },
      {} as Record<string, string>
    );
    updateField('env', envObj);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Job Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Box className="h-3.5 w-3.5" />
              Service Name
            </Label>
            <Input
              id="name"
              value={value.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="my-service"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-2">
              <Box className="h-3.5 w-3.5" />
              Docker Image
            </Label>
            <Input
              id="image"
              value={value.image || ''}
              onChange={(e) => updateField('image', e.target.value)}
              placeholder="nginx:latest"
            />
            {errors.image && (
              <p className="text-xs text-red-500">{errors.image}</p>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Resources</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cpu" className="flex items-center gap-2 text-xs">
                <Cpu className="h-3 w-3" />
                CPU Cores
              </Label>
              <Select
                value={String(value.cpu || '1')}
                onValueChange={(v) => updateField('cpu', parseFloat(v))}
              >
                <SelectTrigger id="cpu">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CPU_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt} cores
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory" className="flex items-center gap-2 text-xs">
                <MemoryStick className="h-3 w-3" />
                Memory
              </Label>
              <Select
                value={value.memory || '1Gi'}
                onValueChange={(v) => updateField('memory', v)}
              >
                <SelectTrigger id="memory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage" className="flex items-center gap-2 text-xs">
                <HardDrive className="h-3 w-3" />
                Storage
              </Label>
              <Select
                value={value.storage || '10Gi'}
                onValueChange={(v) => updateField('storage', v)}
              >
                <SelectTrigger id="storage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* GPU */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              GPU Configuration
            </Label>
            <Badge variant={value.gpu ? "default" : "outline"}>
              {value.gpu ? `${value.gpu.units}x GPU` : 'No GPU'}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gpu-units" className="text-xs">GPU Count</Label>
              <Select
                value={String(value.gpu?.units || 0)}
                onValueChange={(v) =>
                  updateField('gpu', {
                    units: parseInt(v, 10),
                    model: value.gpu?.model
                  })
                }
              >
                <SelectTrigger id="gpu-units">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No GPU</SelectItem>
                  <SelectItem value="1">1 GPU</SelectItem>
                  <SelectItem value="2">2 GPUs</SelectItem>
                  <SelectItem value="4">4 GPUs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpu-model" className="text-xs">GPU Model</Label>
              <Select
                value={value.gpu?.model || 'nvidia'}
                onValueChange={(v) =>
                  updateField('gpu', {
                    units: value.gpu?.units || 1,
                    model: v
                  })
                }
                disabled={!value.gpu?.units}
              >
                <SelectTrigger id="gpu-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GPU_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-3.5 w-3.5" />
            Network & Ports
          </Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="port" className="text-xs">Port</Label>
              <Input
                id="port"
                type="number"
                value={value.port || ''}
                onChange={(e) => updateField('port', parseInt(e.target.value, 10) || undefined)}
                placeholder="80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expose" className="text-xs">Expose Publicly</Label>
              <Select
                value={value.expose ? 'true' : 'false'}
                onValueChange={(v) => updateField('expose', v === 'true')}
              >
                <SelectTrigger id="expose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-xs">Region</Label>
              <Select
                value={value.region || ''}
                onValueChange={(v) => updateField('region', v || undefined)}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Region</SelectItem>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Environment Variables</Label>
            <Button variant="outline" size="sm" onClick={addEnvVar}>
              Add Variable
            </Button>
          </div>
          {envVars.length > 0 ? (
            <div className="space-y-2">
              {envVars.map((env, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={env.key}
                    onChange={(e) => handleEnvChange(index, e.target.value, env.value)}
                    placeholder="KEY"
                    className="flex-1"
                  />
                  <Input
                    value={env.value}
                    onChange={(e) => handleEnvChange(index, env.key, e.target.value)}
                    placeholder="value"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeEnvVar(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No environment variables configured</p>
          )}
        </div>

        {/* Form Errors */}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the validation errors above
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

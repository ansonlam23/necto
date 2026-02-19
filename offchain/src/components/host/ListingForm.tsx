'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMarketplace } from '@/context/MarketplaceContext';
import { GPU_MODELS, REGIONS } from '@/types/marketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Cpu, DollarSign, Globe, HardDrive, Server, Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const listingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  institutionName: z.string().min(2, 'Institution name is required'),

  // Hardware
  gpuModel: z.enum(['H100', 'A100', 'RTX 4090', 'RTX 3090', 'V100', 'T4']),
  gpuCount: z.number().min(1).max(8),
  vram: z.number().min(8).max(80),
  cpuCores: z.number().min(4).max(128),
  ram: z.number().min(8).max(1024),
  storage: z.number().min(100).max(10000).optional(),

  // Pricing
  hourlyRate: z.number().min(0.1).max(100),
  minimumRentalHours: z.number().min(1).max(168),

  // Availability
  status: z.enum(['online', 'offline', 'maintenance']),
  region: z.enum(['us-east', 'us-west', 'eu-west', 'eu-central', 'asia-pacific', 'asia-south']),
  schedule: z.string().optional(),

  // Performance
  uptime: z.number().min(90).max(100),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface ListingFormProps {
  onSuccess?: () => void;
}

export function ListingForm({ onSuccess }: ListingFormProps) {
  const { addMachine } = useMarketplace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      gpuCount: 1,
      vram: 24,
      cpuCores: 8,
      ram: 32,
      storage: 500,
      hourlyRate: 1.5,
      minimumRentalHours: 1,
      status: 'online',
      region: 'us-east',
      uptime: 99.5,
    },
  });

  const selectedGpuModel = watch('gpuModel');

  // Auto-set VRAM based on GPU model
  const handleGpuChange = (value: string) => {
    setValue('gpuModel', value as any);
    const gpu = GPU_MODELS.find(g => g.value === value);
    if (gpu) {
      setValue('vram', gpu.vram);
    }
  };

  const onSubmit = async (data: ListingFormData) => {
    setIsSubmitting(true);
    try {
      addMachine({
        name: data.name,
        institutionName: data.institutionName,
        hardware: {
          gpuModel: data.gpuModel,
          vram: data.vram,
          gpuCount: data.gpuCount,
          cpuCores: data.cpuCores,
          ram: data.ram,
          storage: data.storage,
        },
        pricing: {
          hourlyRate: data.hourlyRate,
          minimumRentalHours: data.minimumRentalHours,
          currency: 'USD',
        },
        availability: {
          status: data.status,
          region: data.region,
          schedule: data.schedule,
        },
        performance: {
          uptime: data.uptime,
        },
      });

      toast.success('Machine listed successfully!', {
        description: 'Your compute resource is now available in the marketplace.',
      });

      reset();
      setStep(1);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to list machine', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <Card>
      <CardHeader>
        <CardTitle>List Your Compute</CardTitle>
        <CardDescription>
          Make your idle GPU resources available to the marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={cn(
                  "flex items-center",
                  i < 3 && "flex-1"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                    step >= i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      step > i ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Hardware Specs */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Hardware Specifications</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gpuModel">GPU Model *</Label>
                  <Select onValueChange={handleGpuChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select GPU" />
                    </SelectTrigger>
                    <SelectContent>
                      {GPU_MODELS.map(gpu => (
                        <SelectItem key={gpu.value} value={gpu.value}>
                          {gpu.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gpuModel && (
                    <p className="text-xs text-destructive">{errors.gpuModel.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpuCount">GPU Count *</Label>
                  <Input
                    type="number"
                    {...register('gpuCount', { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {errors.gpuCount && (
                    <p className="text-xs text-destructive">{errors.gpuCount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpuCores">CPU Cores *</Label>
                  <Input
                    type="number"
                    {...register('cpuCores', { valueAsNumber: true })}
                    placeholder="8"
                  />
                  {errors.cpuCores && (
                    <p className="text-xs text-destructive">{errors.cpuCores.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ram">RAM (GB) *</Label>
                  <Input
                    type="number"
                    {...register('ram', { valueAsNumber: true })}
                    placeholder="32"
                  />
                  {errors.ram && (
                    <p className="text-xs text-destructive">{errors.ram.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Storage (GB)</Label>
                  <Input
                    type="number"
                    {...register('storage', { valueAsNumber: true })}
                    placeholder="500"
                  />
                  {errors.storage && (
                    <p className="text-xs text-destructive">{errors.storage.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vram">VRAM (GB) *</Label>
                  <Input
                    type="number"
                    {...register('vram', { valueAsNumber: true })}
                    placeholder="24"
                    disabled={!!selectedGpuModel}
                  />
                  {errors.vram && (
                    <p className="text-xs text-destructive">{errors.vram.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Availability */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Pricing</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate (USD) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('hourlyRate', { valueAsNumber: true })}
                      placeholder="1.50"
                    />
                    {errors.hourlyRate && (
                      <p className="text-xs text-destructive">{errors.hourlyRate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumRentalHours">Minimum Rental (hours) *</Label>
                    <Input
                      type="number"
                      {...register('minimumRentalHours', { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {errors.minimumRentalHours && (
                      <p className="text-xs text-destructive">{errors.minimumRentalHours.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Availability</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region *</Label>
                    <Select onValueChange={value => setValue('region', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(region => (
                          <SelectItem key={region.value} value={region.value}>
                            <span className="mr-2">{region.flag}</span>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.region && (
                      <p className="text-xs text-destructive">{errors.region.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule">Availability Schedule</Label>
                    <Textarea
                      {...register('schedule')}
                      placeholder="e.g., Available 24/7, Weeknights only, Business hours..."
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="status">Go Live Immediately</Label>
                    <Switch
                      checked={watch('status') === 'online'}
                      onCheckedChange={checked => setValue('status', checked ? 'online' : 'offline')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Institution Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Institution Details</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Machine Name *</Label>
                  <Input
                    {...register('name')}
                    placeholder="e.g., Research Cluster Node 1"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionName">Institution Name *</Label>
                  <Input
                    {...register('institutionName')}
                    placeholder="e.g., MIT AI Lab, Stanford Research"
                  />
                  {errors.institutionName && (
                    <p className="text-xs text-destructive">{errors.institutionName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uptime">Expected Uptime (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('uptime', { valueAsNumber: true })}
                    placeholder="99.5"
                  />
                  {errors.uptime && (
                    <p className="text-xs text-destructive">{errors.uptime.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={nextStep} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting ? 'Listing...' : 'List Machine'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
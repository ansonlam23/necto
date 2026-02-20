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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Cpu, DollarSign, Building2, CheckCircle2, Shield } from 'lucide-react';
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

  // Policy & Compliance - Access Control
  requireKyc: z.boolean().optional(),
  allowedRegions: z.array(z.string()).optional(),
  allowedEmailDomains: z.string().optional(),

  // Policy & Compliance - Workload Restrictions
  prohibitedUses: z.array(z.string()).optional(),
  customProhibitedUses: z.string().optional(),
  maxJobDuration: z.number().min(1).max(720).optional(),

  // Policy & Compliance - Security Level
  networkAccess: z.enum(['public', 'private-vpc', 'air-gapped']).optional(),
  confidentialComputing: z.boolean().optional(),
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
      requireKyc: false,
      allowedRegions: [],
      allowedEmailDomains: '',
      prohibitedUses: [],
      customProhibitedUses: '',
      maxJobDuration: 168,
      networkAccess: 'public',
      confidentialComputing: false,
    },
  });

  const selectedGpuModel = watch('gpuModel');

  // Auto-set VRAM based on GPU model
  const handleGpuChange = (value: string) => {
    setValue('gpuModel', value as 'H100' | 'A100' | 'RTX 4090' | 'RTX 3090' | 'V100' | 'T4');
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
    } catch {
      toast.error('Failed to list machine', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
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
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={cn(
                  "flex items-center",
                  i < 4 && "flex-1"
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
                {i < 4 && (
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
            <Card className="border-gray-700/60 bg-gray-800/80">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Hardware Specifications</CardTitle>
                </div>
                <CardDescription>
                  Configure your compute resources and hardware capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Step 2: Pricing & Availability */}
          {step === 2 && (
            <Card className="border-gray-700/60 bg-gray-800/80">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Pricing & Availability</CardTitle>
                </div>
                <CardDescription>
                  Set your pricing model and availability preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-sm mb-4">Pricing</h4>
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

                <div className="border-t border-primary/10 pt-6">
                  <h4 className="font-medium text-sm mb-4">
                    Availability
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region *</Label>
                      <Select onValueChange={value => setValue('region', value as 'us-east' | 'us-west' | 'eu-west' | 'eu-central' | 'asia-pacific' | 'asia-south')}>
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
              </CardContent>
            </Card>
          )}

          {/* Step 3: Institution Details */}
          {step === 3 && (
            <Card className="border-gray-700/60 bg-gray-800/80">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Institution Details</CardTitle>
                </div>
                <CardDescription>
                  Provide institutional information and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Step 4: Policy & Compliance */}
          {step === 4 && (
            <Card className="border-gray-700/60 bg-gray-800/80">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Institutional Controls</CardTitle>
                  </div>
                  <CardDescription>
                    Enterprise-grade policy enforcement and compliance settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Access Control Section */}
                  <div className="space-y-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-slate-200">Access Control</h4>
                    </div>

                    <div className="space-y-4 pl-6">
                      {/* KYC Requirement */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="requireKyc" className="text-sm font-medium">
                            Require Verified User Identity (KYC)
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Only allow access from verified institutional accounts
                          </p>
                        </div>
                        <Switch
                          id="requireKyc"
                          checked={watch('requireKyc')}
                          onCheckedChange={checked => setValue('requireKyc', checked)}
                        />
                      </div>

                      {/* Geo-Fencing */}
                      <div className="space-y-2">
                        <Label htmlFor="allowedRegions" className="text-sm font-medium">
                          Allow Regions
                        </Label>
                        <div className="flex gap-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={watch('allowedRegions')?.includes('US')}
                              onCheckedChange={checked => {
                                const current = watch('allowedRegions') || [];
                                if (checked) {
                                  setValue('allowedRegions', [...current, 'US']);
                                } else {
                                  setValue('allowedRegions', current.filter(r => r !== 'US'));
                                }
                              }}
                            />
                            <span className="text-sm">US</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={watch('allowedRegions')?.includes('EU')}
                              onCheckedChange={checked => {
                                const current = watch('allowedRegions') || [];
                                if (checked) {
                                  setValue('allowedRegions', [...current, 'EU']);
                                } else {
                                  setValue('allowedRegions', current.filter(r => r !== 'EU'));
                                }
                              }}
                            />
                            <span className="text-sm">EU</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={watch('allowedRegions')?.includes('APAC')}
                              onCheckedChange={checked => {
                                const current = watch('allowedRegions') || [];
                                if (checked) {
                                  setValue('allowedRegions', [...current, 'APAC']);
                                } else {
                                  setValue('allowedRegions', current.filter(r => r !== 'APAC'));
                                }
                              }}
                            />
                            <span className="text-sm">APAC</span>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Restrict access to specific geographic regions
                        </p>
                      </div>

                      {/* Institution Whitelist */}
                      <div className="space-y-2">
                        <Label htmlFor="allowedEmailDomains" className="text-sm font-medium">
                          Allowed Email Domains
                        </Label>
                        <Input
                          {...register('allowedEmailDomains')}
                          placeholder="e.g., @mit.edu, @stanford.edu"
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Whitelist institutional email domains for access
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Workload Restrictions Section */}
                  <div className="space-y-4 border-t border-primary/10 pt-6">
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-slate-200">Workload Restrictions</h4>
                    </div>

                    <div className="space-y-4 pl-6">
                      {/* Prohibited Uses */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Prohibited Uses</Label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={watch('prohibitedUses')?.includes('crypto-mining')}
                              onCheckedChange={checked => {
                                const current = watch('prohibitedUses') || [];
                                if (checked) {
                                  setValue('prohibitedUses', [...current, 'crypto-mining']);
                                } else {
                                  setValue('prohibitedUses', current.filter(u => u !== 'crypto-mining'));
                                }
                              }}
                            />
                            <span className="text-sm">Crypto Mining</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={watch('prohibitedUses')?.includes('nsfw')}
                              onCheckedChange={checked => {
                                const current = watch('prohibitedUses') || [];
                                if (checked) {
                                  setValue('prohibitedUses', [...current, 'nsfw']);
                                } else {
                                  setValue('prohibitedUses', current.filter(u => u !== 'nsfw'));
                                }
                              }}
                            />
                            <span className="text-sm">NSFW Content</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={watch('prohibitedUses')?.includes('vpn-proxy')}
                              onCheckedChange={checked => {
                                const current = watch('prohibitedUses') || [];
                                if (checked) {
                                  setValue('prohibitedUses', [...current, 'vpn-proxy']);
                                } else {
                                  setValue('prohibitedUses', current.filter(u => u !== 'vpn-proxy'));
                                }
                              }}
                            />
                            <span className="text-sm">VPN/Proxy Services</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={watch('prohibitedUses')?.includes('other')}
                              onCheckedChange={checked => {
                                const current = watch('prohibitedUses') || [];
                                if (checked) {
                                  setValue('prohibitedUses', [...current, 'other']);
                                } else {
                                  setValue('prohibitedUses', current.filter(u => u !== 'other'));
                                  setValue('customProhibitedUses', '');
                                }
                              }}
                            />
                            <span className="text-sm">Other</span>
                          </label>
                          {watch('prohibitedUses')?.includes('other') && (
                            <div className="ml-6 mt-2">
                              <Textarea
                                {...register('customProhibitedUses')}
                                placeholder="Specify other prohibited uses (e.g., web scraping, botting, illegal activities...)"
                                className="text-sm min-h-[60px]"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Block specific workload types from running on your hardware
                        </p>
                      </div>

                      {/* Max Duration */}
                      <div className="space-y-2">
                        <Label htmlFor="maxJobDuration" className="text-sm font-medium">
                          Max Job Length (Hours)
                        </Label>
                        <Input
                          type="number"
                          {...register('maxJobDuration', { valueAsNumber: true })}
                          placeholder="168"
                          className="w-32"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum duration for a single compute job
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Level Section */}
                  <div className="space-y-4 border-t border-primary/10 pt-6">
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-slate-200">Security Level</h4>
                    </div>

                    <div className="space-y-4 pl-6">
                      {/* Network Access */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Network Access</Label>
                        <RadioGroup
                          value={watch('networkAccess')}
                          onValueChange={value => setValue('networkAccess', value as 'public' | 'private-vpc' | 'air-gapped')}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="public" id="public" />
                            <Label htmlFor="public" className="text-sm font-normal cursor-pointer">
                              Public Internet
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="private-vpc" id="private-vpc" />
                            <Label htmlFor="private-vpc" className="text-sm font-normal cursor-pointer">
                              Private VPC
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="air-gapped" id="air-gapped" />
                            <Label htmlFor="air-gapped" className="text-sm font-normal cursor-pointer">
                              Air-Gapped
                            </Label>
                          </div>
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground">
                          Network isolation level for compute workloads
                        </p>
                      </div>

                      {/* Confidential Computing */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="confidentialComputing" className="text-sm font-medium">
                            Confidential Computing
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Enable Intel SGX / AMD SEV for encrypted computation
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {watch('confidentialComputing') && (
                            <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-400">
                              Secure Enclave
                            </Badge>
                          )}
                          <Switch
                            id="confidentialComputing"
                            checked={watch('confidentialComputing')}
                            onCheckedChange={checked => setValue('confidentialComputing', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {step < 4 ? (
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
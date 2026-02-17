'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { SdlTemplate, JobRequirements, generateSDL } from '@/lib/akash/sdl-generator';
import { useAkashDeployment } from '@/hooks/use-akash-deployment';
import { TemplateGallery } from '@/components/akash/template-gallery';
import { NaturalLanguageInput } from '@/components/akash/natural-language-input';
import { RequirementsForm } from '@/components/akash/requirements-form';
import { SdlEditor } from '@/components/akash/sdl-editor';
import { ProviderList } from '@/components/akash/provider-list';
import { DeploymentStatus } from '@/components/akash/deployment-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Wand2,
  FileCode,
  Server,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Sparkles,
  Settings2,
  Eye
} from 'lucide-react';

type Step = 'input' | 'configure' | 'sdl' | 'review' | 'deploy';

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'input', label: 'Create Job', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'configure', label: 'Configure', icon: <Settings2 className="h-4 w-4" /> },
  { id: 'sdl', label: 'SDL', icon: <FileCode className="h-4 w-4" /> },
  { id: 'review', label: 'Review', icon: <Eye className="h-4 w-4" /> },
  { id: 'deploy', label: 'Deploy', icon: <Server className="h-4 w-4" /> }
];

const STEP_ORDER: Step[] = ['input', 'configure', 'sdl', 'review', 'deploy'];

export default function SubmitJobPage() {
  // State
  const [currentStep, setCurrentStep] = React.useState<Step>('input');
  const [inputMethod, setInputMethod] = React.useState<'template' | 'natural' | 'manual'>('template');
  const [selectedTemplate, setSelectedTemplate] = React.useState<SdlTemplate | null>(null);
  const [requirements, setRequirements] = React.useState<Partial<JobRequirements>>({});
  const [selectedProviderId, setSelectedProviderId] = React.useState<string | null>(null);
  const [autoSign, setAutoSign] = React.useState(true);
  const [escrowAmount, setEscrowAmount] = React.useState<string>('10');
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Deployment hook
  const deployment = useAkashDeployment();

  // Calculate step progress
  const stepProgress = ((STEP_ORDER.indexOf(currentStep) + 1) / STEPS.length) * 100;

  // Handle template selection
  const handleTemplateSelect = (template: SdlTemplate) => {
    setSelectedTemplate(template);
    setRequirements(template.requirements);
  };

  // Handle natural language parsing
  const handleNaturalLanguageParsed = (parsed: Partial<JobRequirements>) => {
    setRequirements(prev => ({ ...prev, ...parsed }));
  };

  // Handle requirements change
  const handleRequirementsChange = (newRequirements: Partial<JobRequirements>) => {
    setRequirements(newRequirements);
    setFormErrors({});
  };

  // Validate requirements
  const validateRequirements = (): boolean => {
    const errors: Record<string, string> = {};

    if (!requirements.name) {
      errors.name = 'Service name is required';
    }
    if (!requirements.image) {
      errors.image = 'Docker image is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers
  const goToNextStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);

    if (currentStep === 'configure') {
      if (!validateRequirements()) return;
    }

    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  // Handle deployment
  const handleDeploy = async () => {
    if (!requirements.name || !requirements.image) {
      setFormErrors({
        name: !requirements.name ? 'Service name is required' : '',
        image: !requirements.image ? 'Docker image is required' : ''
      });
      return;
    }

    await deployment.startDeployment(requirements as JobRequirements, autoSign);
  };

  // Generate SDL for preview
  const generatedSDL = React.useMemo(() => {
    if (requirements.name && requirements.image) {
      return generateSDL(requirements as JobRequirements);
    }
    return null;
  }, [requirements]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Create Your Compute Job</h2>
              <p className="text-muted-foreground">
                Choose how you want to define your deployment
              </p>
            </div>

            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as typeof inputMethod)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="template" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="natural" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Natural Language
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="mt-6">
                <TemplateGallery
                  onSelect={handleTemplateSelect}
                  selectedId={selectedTemplate?.id}
                />
              </TabsContent>

              <TabsContent value="natural" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Describe Your Job</CardTitle>
                    <CardDescription>
                      Tell us what you need in plain language
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NaturalLanguageInput onParsed={handleNaturalLanguageParsed} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual" className="mt-6">
                <RequirementsForm
                  value={requirements}
                  onChange={handleRequirementsChange}
                  errors={formErrors}
                />
              </TabsContent>
            </Tabs>

            {/* Quick status */}
            {(selectedTemplate || requirements.name) && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {selectedTemplate?.name || requirements.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {requirements.image}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {requirements.gpu ? `${requirements.gpu.units}x GPU` : 'CPU Only'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Configure Resources</h2>
              <p className="text-muted-foreground">
                Fine-tune your deployment settings
              </p>
            </div>

            <RequirementsForm
              value={requirements}
              onChange={handleRequirementsChange}
              errors={formErrors}
            />
          </div>
        );

      case 'sdl':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">SDL Configuration</h2>
              <p className="text-muted-foreground">
                Review and customize your deployment manifest
              </p>
            </div>

            <SdlEditor
              requirements={requirements}
              sdl={generatedSDL || undefined}
            />
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Review & Deploy</h2>
              <p className="text-muted-foreground">
                Confirm your deployment settings
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deployment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">{requirements.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Image</span>
                      <span className="font-mono text-xs">{requirements.image}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU</span>
                      <span>{requirements.cpu || 1} cores</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory</span>
                      <span>{requirements.memory || '1Gi'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage</span>
                      <span>{requirements.storage || '10Gi'}</span>
                    </div>
                    {requirements.gpu && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GPU</span>
                        <span className="text-amber-500">
                          {requirements.gpu.units}x {requirements.gpu.model || 'NVIDIA'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region</span>
                      <span>{requirements.region || 'Any'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Provider Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProviderList
                    onSelect={setSelectedProviderId}
                    selectedId={selectedProviderId || undefined}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Payment & Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Escrow */}
                <div className="space-y-2">
                  <Label>Escrow Deposit (Testnet USDC)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={escrowAmount}
                      onChange={(e) => setEscrowAmount(e.target.value)}
                      className="flex-1"
                    />
                    <span className="font-mono text-lg w-20 text-right">
                      {escrowAmount} USDC
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Testnet USDC for demo payment flow. Necto sponsors actual Akash costs.
                  </p>
                </div>

                {/* Auto-sign */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-sign</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically accept provider bids (streamlined demo flow)
                    </p>
                  </div>
                  <Switch
                    checked={autoSign}
                    onCheckedChange={setAutoSign}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cost Estimate */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Estimated Cost:</strong> ~${requirements.gpu ? '0.50' : '0.10'}/hr
                (Necto sponsors Akash hosting for hackathon demo)
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'deploy':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Deployment Status</h2>
              <p className="text-muted-foreground">
                Track your deployment progress
              </p>
            </div>

            <DeploymentStatus deployment={deployment} />

            {deployment.state === 'idle' && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleDeploy}
                  disabled={deployment.isLoading}
                >
                  {deployment.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      Deploy to Akash
                    </>
                  )}
                </Button>
              </div>
            )}

            {deployment.state === 'active' && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Deployment Active</p>
                      <p className="text-sm text-green-600">
                        Your workload is running on Akash Network
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {deployment.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deployment.error}</AlertDescription>
              </Alert>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index < STEPS.length - 1 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                  STEP_ORDER.indexOf(currentStep) >= index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    STEP_ORDER.indexOf(currentStep) > index
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <Progress value={stepProgress} className="h-1" />
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      {currentStep !== 'deploy' && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 'input'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button onClick={goToNextStep}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Reset after completion */}
      {deployment.state === 'completed' && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={() => {
            deployment.reset();
            setCurrentStep('input');
            setSelectedTemplate(null);
            setRequirements({});
            setSelectedProviderId(null);
          }}>
            Start New Deployment
          </Button>
        </div>
      )}
    </div>
  );
}

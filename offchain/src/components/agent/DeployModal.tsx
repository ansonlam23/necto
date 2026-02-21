'use client';

import * as React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { cn } from '@/lib/utils';
import YAML from 'js-yaml';
import { generateSDL } from '@/lib/akash/sdl-generator';
import type { JobRequirements } from '@/lib/akash/sdl-generator';
import { useAkashDeployment } from '@/hooks/use-akash-deployment';
import { DeploymentStatus } from '@/components/akash/deployment-status';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DeploymentConfig } from '@/types/deployment';
import type { LeaseResponse } from '@/types/akash';
import {
  Server,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  ExternalLink,
  Copy,
  ArrowRightLeft,
  User,
  Globe,
  FileCode,
  Settings2,
  Activity,
} from 'lucide-react';

const EXPLORER_URL = 'https://explorer.ab.testnet.adifoundation.ai';
const AKASH_CONSOLE_URL = 'https://console.akash.network';

const HARDCODED_DEFAULTS: Required<Omit<DeploymentConfig, 'token'>> = {
  dockerImage: 'pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime',
  cpu: 2,
  memory: 16,
  memoryUnit: 'Gi',
  storage: 40,
  storageUnit: 'Gi',
  gpu: 'NVIDIA A100',
  gpuCount: 1,
  port: 8888,
  region: 'us-east',
};

interface EditableConfig {
  dockerImage: string;
  cpu: number;
  memory: number;
  memoryUnit: 'Mi' | 'Gi';
  storage: number;
  storageUnit: 'Mi' | 'Gi';
  gpu: string;
  gpuCount: number;
  port: number;
  region: string;
}

function normalizeGpuModel(raw: string): string {
  // "NVIDIA A100" → "a100", "NVIDIA RTX 4090" → "rtx4090"
  return raw
    .replace(/nvidia\s*/i, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function configToRequirements(cfg: EditableConfig): JobRequirements {
  return {
    name: 'pytorch-training',
    image: cfg.dockerImage,
    cpu: cfg.cpu,
    memory: `${cfg.memory}${cfg.memoryUnit}`,
    storage: `${cfg.storage}${cfg.storageUnit}`,
    // Only pass vendor, no model — avoids "Invalid GPU attributes" rejections
    gpu: cfg.gpu && cfg.gpuCount > 0 ? { units: cfg.gpuCount, vendor: 'nvidia' } : undefined,
    port: cfg.port,
    expose: true,
    // Omit region from SDL to avoid placement attribute rejections
  };
}

function estimateHourlyPrice(cfg: EditableConfig): number {
  let price = 0.02;
  price += cfg.cpu * 0.015;
  const memGi = cfg.memoryUnit === 'Gi' ? cfg.memory : cfg.memory / 1024;
  price += memGi * 0.008;
  if (cfg.gpu && cfg.gpuCount > 0) {
    const gpuName = cfg.gpu.toLowerCase();
    const gpuBase = gpuName.includes('h100') ? 1.20
      : gpuName.includes('a100') ? 0.65
      : gpuName.includes('a10') ? 0.35
      : 0.25;
    price += cfg.gpuCount * gpuBase;
  }
  return price;
}

function extractServiceUris(leaseResponse: LeaseResponse | null): string[] {
  if (!leaseResponse?.data?.leases) return [];
  const uris: string[] = [];
  for (const lease of leaseResponse.data.leases) {
    if (lease.status?.services) {
      for (const svcName in lease.status.services) {
        const svc = lease.status.services[svcName];
        if (svc.uris?.length) uris.push(...svc.uris);
      }
    }
  }
  return uris;
}

function truncateHash(hash: string) {
  return hash.length <= 20 ? hash : `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

interface DeployModalProps {
  open: boolean;
  onClose: () => void;
  config?: DeploymentConfig;
}

export function DeployModal({ open, onClose, config }: DeployModalProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const deployment = useAkashDeployment();

  const initConfig = React.useMemo<EditableConfig>(() => ({
    dockerImage: config?.dockerImage ?? HARDCODED_DEFAULTS.dockerImage,
    cpu:         config?.cpu         ?? HARDCODED_DEFAULTS.cpu,
    memory:      config?.memory      ?? HARDCODED_DEFAULTS.memory,
    memoryUnit:  config?.memoryUnit  ?? HARDCODED_DEFAULTS.memoryUnit,
    storage:     config?.storage     ?? HARDCODED_DEFAULTS.storage,
    storageUnit: config?.storageUnit ?? HARDCODED_DEFAULTS.storageUnit,
    gpu:         config?.gpu         ?? HARDCODED_DEFAULTS.gpu,
    gpuCount:    config?.gpuCount    ?? HARDCODED_DEFAULTS.gpuCount,
    port:        config?.port        ?? HARDCODED_DEFAULTS.port,
    region:      config?.region      ?? HARDCODED_DEFAULTS.region,
  }), [config]);

  const [editConfig, setEditConfig] = React.useState<EditableConfig>(initConfig);
  const [escrowAmount, setEscrowAmount] = React.useState('10');
  const [copiedHash, setCopiedHash] = React.useState(false);
  const [copiedUri, setCopiedUri] = React.useState<string | null>(null);
  const [deployError, setDeployError] = React.useState<string | null>(null);

  React.useEffect(() => { setEditConfig(initConfig); }, [initConfig]);

  const set = <K extends keyof EditableConfig>(key: K, value: EditableConfig[K]) =>
    setEditConfig(prev => ({ ...prev, [key]: value }));

  const hourlyPrice = React.useMemo(() => estimateHourlyPrice(editConfig), [editConfig]);

  const generatedSDL = React.useMemo(() => {
    try { return YAML.dump(generateSDL(configToRequirements(editConfig))); }
    catch { return null; }
  }, [editConfig]);

  const serviceUris = React.useMemo(
    () => extractServiceUris(deployment.leaseResponse),
    [deployment.leaseResponse]
  );

  const handleDeploy = async () => {
    setDeployError(null);
    if (!isConnected || !address) {
      setDeployError('Please connect your wallet first');
      return;
    }
    const amountInUSDC = BigInt(escrowAmount) * BigInt(1_000_000);
    await deployment.startDeployment({
      requirements: configToRequirements(editConfig),
      autoAccept: true,
      escrowAmount: amountInUSDC,
      isTracked: true,
    });
  };

  const copyText = (text: string, kind: 'hash' | string) => {
    navigator.clipboard.writeText(text);
    if (kind === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedUri(text);
      setTimeout(() => setCopiedUri(null), 2000);
    }
  };

  const getPaymentStatusText = () => {
    switch (deployment.escrowState) {
      case 'approving':           return 'Approving USDC spend...';
      case 'approval_confirming': return 'Confirming approval...';
      case 'processing_payment':  return 'Submitting payment request...';
      case 'payment_processing':  return 'Agent processing payment...';
      case 'completed':           return 'Payment completed';
      case 'error':               return 'Payment failed';
      default:                    return 'Processing...';
    }
  };

  const isDeploying = deployment.isLoading || deployment.state !== 'idle';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="!max-w-[90vw] w-[90vw] h-[92vh] flex flex-col p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="text-lg font-semibold">Deploy to Akash Network</DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            <SectionBadge n={1} label="Configuration" />
            <div className="flex-1 h-px bg-border/50" />
            <SectionBadge n={2} label="Payment" />
            <div className="flex-1 h-px bg-border/50" />
            <SectionBadge n={3} label="Deploy" />
          </div>
        </DialogHeader>

        {/* 3-column body */}
        <div className="flex-1 overflow-hidden grid grid-cols-[2fr_1.4fr_2fr] divide-x divide-border/50">

          {/* ── Section 1: Configuration ── */}
          <div className="overflow-y-auto p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Configuration</h3>
            </div>

            <div className="space-y-3">
              <FieldRow label="Docker Image">
                <Input
                  value={editConfig.dockerImage}
                  onChange={e => set('dockerImage', e.target.value)}
                  className="font-mono text-xs h-8"
                />
              </FieldRow>

              <FieldRow label="CPU (vCPU)">
                <Input
                  type="number" min={1} max={64}
                  value={editConfig.cpu}
                  onChange={e => set('cpu', Number(e.target.value))}
                  className="font-mono text-xs h-8"
                />
              </FieldRow>

              <FieldRow label="Memory">
                <div className="flex gap-2">
                  <Input
                    type="number" min={1}
                    value={editConfig.memory}
                    onChange={e => set('memory', Number(e.target.value))}
                    className="font-mono text-xs h-8 flex-1"
                  />
                  <Select value={editConfig.memoryUnit} onValueChange={v => set('memoryUnit', v as 'Mi' | 'Gi')}>
                    <SelectTrigger className="w-16 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mi">Mi</SelectItem>
                      <SelectItem value="Gi">Gi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FieldRow>

              <FieldRow label="Storage">
                <div className="flex gap-2">
                  <Input
                    type="number" min={1}
                    value={editConfig.storage}
                    onChange={e => set('storage', Number(e.target.value))}
                    className="font-mono text-xs h-8 flex-1"
                  />
                  <Select value={editConfig.storageUnit} onValueChange={v => set('storageUnit', v as 'Mi' | 'Gi')}>
                    <SelectTrigger className="w-16 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mi">Mi</SelectItem>
                      <SelectItem value="Gi">Gi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FieldRow>

              <FieldRow label="GPU Model">
                <Input
                  value={editConfig.gpu}
                  onChange={e => set('gpu', e.target.value)}
                  placeholder="e.g. NVIDIA A100"
                  className="font-mono text-xs h-8"
                />
              </FieldRow>

              <FieldRow label="GPU Count">
                <Input
                  type="number" min={0} max={8}
                  value={editConfig.gpuCount}
                  onChange={e => set('gpuCount', Number(e.target.value))}
                  className="font-mono text-xs h-8"
                />
              </FieldRow>

              <FieldRow label="Port">
                <Input
                  type="number"
                  value={editConfig.port}
                  onChange={e => set('port', Number(e.target.value))}
                  className="font-mono text-xs h-8"
                />
              </FieldRow>

              <FieldRow label="Region">
                <Input
                  value={editConfig.region}
                  onChange={e => set('region', e.target.value)}
                  placeholder="e.g. us-east"
                  className="font-mono text-xs h-8"
                />
              </FieldRow>
            </div>

            <Separator />

            {/* SDL Preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Generated SDL</span>
              </div>
              <pre className="text-[10px] font-mono bg-muted/30 border border-border/50 rounded-lg p-3 overflow-x-auto overflow-y-auto max-h-56 leading-relaxed whitespace-pre-wrap break-all">
                {generatedSDL ?? '# Fill in docker image and name to generate SDL'}
              </pre>
            </div>
          </div>

          {/* ── Section 2: Payment ── */}
          <div className="overflow-y-auto p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Payment</h3>
            </div>

            {/* Price estimate */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold font-mono text-primary">
                    ${hourlyPrice.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">estimated / hour</div>
                </div>
                <Separator />
                <div className="space-y-1.5 text-xs">
                  <PriceLine label={`CPU (${editConfig.cpu} vCPU)`}     value={`$${(editConfig.cpu * 0.015).toFixed(3)}/hr`} />
                  <PriceLine label={`RAM (${editConfig.memory}${editConfig.memoryUnit})`} value={`$${((editConfig.memoryUnit === 'Gi' ? editConfig.memory : editConfig.memory / 1024) * 0.008).toFixed(3)}/hr`} />
                  {editConfig.gpu && (
                    <PriceLine label={`GPU (${editConfig.gpuCount}× ${editConfig.gpu})`} value={`$${(editConfig.gpuCount * 0.65).toFixed(3)}/hr`} accent />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Wallet */}
            <div className="space-y-2">
              <Label className="text-xs">Wallet</Label>
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                isConnected ? "border-green-500/30 bg-green-500/5" : "border-border/50 bg-muted/20"
              )}>
                <div className={cn("p-1.5 rounded-full", isConnected ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground")}>
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{isConnected ? 'Connected' : 'Not Connected'}</p>
                  {isConnected && address && (
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{address.slice(0, 8)}...{address.slice(-6)}</p>
                  )}
                </div>
                {isConnected ? (
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => disconnect()}>Disconnect</Button>
                ) : (
                  <Button size="sm" className="h-6 text-xs px-2" onClick={() => connect({ connector: connectors[0] })} disabled={isConnecting}>
                    {isConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
                  </Button>
                )}
              </div>
            </div>

            {/* Escrow slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Escrow Deposit</Label>
                <span className="text-sm font-mono font-semibold">{escrowAmount} USDC</span>
              </div>
              <input
                type="range" min="1" max="100"
                value={escrowAmount}
                onChange={e => setEscrowAmount(e.target.value)}
                className="w-full accent-primary"
                disabled={isDeploying}
              />
              <p className="text-[10px] text-muted-foreground">
                Testnet USDC · Necto sponsors actual Akash costs
              </p>
            </div>

            <Separator />

            {/* Deploy button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleDeploy}
              disabled={isDeploying || !isConnected}
            >
              {deployment.isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{deployment.state === 'paying_escrow' ? getPaymentStatusText() : 'Deploying...'}</>
              ) : !isConnected ? (
                <><Wallet className="h-4 w-4 mr-2" />Connect Wallet First</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" />Pay {escrowAmount} USDC & Deploy</>
              )}
            </Button>

            {deployError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{deployError}</AlertDescription>
              </Alert>
            )}

            {isDeploying && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  ~${hourlyPrice.toFixed(4)}/hr · Necto sponsors Akash hosting for hackathon demo
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* ── Section 3: Deploy Status ── */}
          <div className="overflow-y-auto p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Deploy Status</h3>
              {deployment.state !== 'idle' && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {deployment.state === 'active' ? '● Live' : deployment.state}
                </Badge>
              )}
            </div>

            {deployment.state === 'idle' && !deployment.error ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground space-y-2">
                <Server className="h-8 w-8 opacity-20" />
                <p className="text-xs">Deploy status will appear here once you pay and submit the job.</p>
              </div>
            ) : (
              <DeploymentStatus deployment={deployment} />
            )}

            {/* Payment transactions */}
            {deployment.escrowTransactions.transferHash && (
              <TxCard
                title="Transfer to Agent"
                icon={<ArrowRightLeft className="h-4 w-4 text-blue-500" />}
                hash={deployment.escrowTransactions.transferHash}
                label="USDC Transfer Completed"
                amount={`${escrowAmount} USDC`}
                explorerUrl={EXPLORER_URL}
                onCopy={() => copyText(deployment.escrowTransactions.transferHash!, 'hash')}
                copied={copiedHash}
              />
            )}

            {deployment.escrowTransactions.submitJobHash && (
              <TxCard
                title="Agent → Escrow Contract"
                icon={<User className="h-4 w-4 text-purple-500" />}
                hash={deployment.escrowTransactions.submitJobHash}
                label="Job Submitted to Escrow"
                jobId={deployment.escrowJobId?.toString()}
                explorerUrl={EXPLORER_URL}
                onCopy={() => copyText(deployment.escrowTransactions.submitJobHash!, 'hash')}
                copied={copiedHash}
              />
            )}

            {deployment.deployment?.id && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Server className="h-3.5 w-3.5" /> Akash Deployment
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Deployment Created</span>
                  </div>
                  <code className="block bg-muted p-2 rounded text-[10px] font-mono truncate">
                    {deployment.deployment.id}
                  </code>
                  <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                    <a href={`${AKASH_CONSOLE_URL}/deployments/${deployment.deployment.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1.5" /> View on Akash Console
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {serviceUris.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" /> Service URLs
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {serviceUris.map((uri, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <code className="flex-1 bg-muted p-1.5 rounded text-[10px] font-mono truncate">{uri}</code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyText(uri, uri)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                        <a href={uri.startsWith('http') ? uri : `http://${uri}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                  {copiedUri && <p className="text-[10px] text-green-500">Copied!</p>}
                </CardContent>
              </Card>
            )}

            {deployment.state === 'active' && (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs font-medium text-green-500">Deployment Active</p>
                      <p className="text-[10px] text-muted-foreground">Running on Akash Network</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {deployment.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{deployment.error}</AlertDescription>
              </Alert>
            )}

            {deployment.state !== 'idle' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => { deployment.reset(); }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Small helper components ── */

function SectionBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
        {n}
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PriceLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono", accent && "text-amber-500 font-semibold")}>{value}</span>
    </div>
  );
}

function TxCard({
  title, icon, hash, label, amount, jobId, explorerUrl, onCopy, copied,
}: {
  title: string;
  icon: React.ReactNode;
  hash: string;
  label: string;
  amount?: string;
  jobId?: string;
  explorerUrl: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span className="text-xs text-green-500 font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <code className="flex-1 bg-muted p-1.5 rounded text-[10px] font-mono truncate">{hash ? `${hash.slice(0,10)}...${hash.slice(-8)}` : ''}</code>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCopy}><Copy className="h-3 w-3" /></Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
            <a href={`${explorerUrl}/tx/${hash}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
          </Button>
        </div>
        {copied && <p className="text-[10px] text-green-500">Copied!</p>}
        {amount && <p className="text-xs font-mono">{amount}</p>}
        {jobId && <p className="text-xs text-muted-foreground">Job ID: <span className="font-mono">{jobId}</span></p>}
      </CardContent>
    </Card>
  );
}

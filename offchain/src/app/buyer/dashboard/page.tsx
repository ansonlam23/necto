'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DeploymentList, DeploymentItem } from '@/components/akash/deployment-list';
import { 
  Plus, 
  Wallet, 
  Server, 
  DollarSign, 
  Clock, 
  Activity,
  ChevronDown,
  Terminal,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock deployment data
const MOCK_DEPLOYMENTS: DeploymentItem[] = [
  {
    id: 'dep-001',
    dseq: '12345',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    serviceName: 'pytorch-gpu',
    provider: 'GPU Cloud East',
    costPerHour: 2.50,
    region: 'us-east',
    leases: 1
  },
  {
    id: 'dep-002',
    dseq: '12346',
    status: 'closed',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    serviceName: 'nginx-web',
    provider: 'Euro Compute',
    costPerHour: 0.50,
    region: 'eu-west',
    leases: 1
  }
];

interface DashboardStats {
  activeDeployments: number;
  totalSpent: number;
  totalDeployments: number;
  escrowBalance: number;
}

export default function BuyerDashboardPage(): React.JSX.Element {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    activeDeployments: 0,
    totalSpent: 0,
    totalDeployments: 0,
    escrowBalance: 0
  });

  // Fetch deployments and escrow balance
  const fetchDeployments = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/deployments');
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data for now
      setDeployments(MOCK_DEPLOYMENTS);
      
      // Calculate stats from deployments
      const activeCount = MOCK_DEPLOYMENTS.filter(d => d.status === 'active').length;
      const totalSpent = MOCK_DEPLOYMENTS.reduce((sum, d) => {
        if (d.costPerHour && d.createdAt) {
          const hours = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60);
          return sum + (d.costPerHour * hours);
        }
        return sum;
      }, 0);
      
      // Fetch escrow balance from API (which reads from contract)
      let escrowBalance = 0;
      if (address) {
        try {
          const escrowResponse = await fetch('/api/escrow', {
            headers: { 'x-user-address': address }
          });
          if (escrowResponse.ok) {
            const escrowData = await escrowResponse.json();
            // Calculate total deposited from active escrows
            // Note: API returns limited data without an indexer
            const totalDeposited = escrowData.summary?.totalDeposited || '0';
            escrowBalance = Number(totalDeposited) / 1_000_000; // Convert from USDC decimals
          }
        } catch (error) {
          console.error('Failed to fetch escrow balance:', error);
        }
      }
      
      setStats({
        activeDeployments: activeCount,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalDeployments: MOCK_DEPLOYMENTS.length,
        escrowBalance
      });
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Load deployments on mount
  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDeployments, 30000);
    return () => clearInterval(interval);
  }, [fetchDeployments]);

  // Recalculate stats when deployments change (e.g., after closing)
  useEffect(() => {
    const activeCount = deployments.filter(d => d.status === 'active').length;
    const totalSpent = deployments.reduce((sum, d) => {
      if (d.costPerHour && d.createdAt) {
        const hours = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60);
        return sum + (d.costPerHour * hours);
      }
      return sum;
    }, 0);

    setStats(prev => ({
      ...prev,
      activeDeployments: activeCount,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalDeployments: deployments.length
    }));
  }, [deployments]);

  const handleViewLogs = async (deploymentId: string) => {
    setSelectedDeployment(deploymentId);
    setShowLogDialog(true);
    setIsLoadingLogs(true);
    
    try {
      // TODO: Connect to real SSE endpoint
      // const eventSource = new EventSource(`/api/deployments/${deploymentId}/logs`);
      
      // Mock logs for now
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogs([
        `[2026-02-17T10:00:00Z] Deployment initiated`,
        `[2026-02-17T10:00:05Z] Provider matched: GPU Cloud East`,
        `[2026-02-17T10:00:10Z] Creating lease...`,
        `[2026-02-17T10:00:15Z] Lease created successfully`,
        `[2026-02-17T10:00:20Z] Pulling container image...`,
        `[2026-02-17T10:01:30Z] Container started`,
        `[2026-02-17T10:01:35Z] Service ready at http://gpu-cloud-east.com:8080`
      ]);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs(['Error loading logs']);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleCloseDeployment = async (deploymentId: string) => {
    try {
      // TODO: Call close deployment API
      // await fetch(`/api/deployments/${deploymentId}`, { method: 'DELETE' });
      
      // Update local state
      setDeployments(prev => 
        prev.map(d => d.id === deploymentId ? { ...d, status: 'closed' as const } : d)
      );
    } catch (error) {
      console.error('Failed to close deployment:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view your deployments
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your compute deployments and escrow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/buyer/providers/compare')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Compare Providers
          </Button>
          <Button onClick={() => router.push('/buyer/submit')}>
            <Plus className="mr-2 h-4 w-4" />
            New Deployment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeployments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeployments} total deployments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime compute costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.escrowBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Available for deployments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deployments Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {stats.activeDeployments > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.activeDeployments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Deployments</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <DeploymentList
            deployments={deployments.filter(d => d.status === 'active')}
            isLoading={isLoading}
            onViewLogs={handleViewLogs}
            onCloseDeployment={handleCloseDeployment}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <DeploymentList
            deployments={deployments}
            isLoading={isLoading}
            onViewLogs={handleViewLogs}
            onCloseDeployment={handleCloseDeployment}
          />
        </TabsContent>

        <TabsContent value="closed" className="mt-4">
          <DeploymentList
            deployments={deployments.filter(d => d.status === 'closed')}
            isLoading={isLoading}
            onViewLogs={handleViewLogs}
            onCloseDeployment={handleCloseDeployment}
          />
        </TabsContent>
      </Tabs>

      {/* Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Deployment Logs
            </DialogTitle>
            <DialogDescription>
              {selectedDeployment && `Deployment ID: ${selectedDeployment}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4 font-mono text-sm h-[400px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="py-1">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

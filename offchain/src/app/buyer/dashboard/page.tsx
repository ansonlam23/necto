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
  RefreshCw
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

export default function BuyerDashboardPage(): JSX.Element {
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

  // Fetch deployments
  const fetchDeployments = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/deployments', {
      //   headers: { 'x-user-address': address || '' }
      // });
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setDeployments(MOCK_DEPLOYMENTS);
      
      // Calculate stats
      const active = MOCK_DEPLOYMENTS.filter(d => d.status === 'active');
      const totalSpent = MOCK_DEPLOYMENTS.reduce((sum, d) => {
        if (d.costPerHour) {
          const duration = d.expiresAt 
            ? new Date(d.expiresAt).getTime() - new Date(d.createdAt).getTime()
            : Date.now() - new Date(d.createdAt).getTime();
          const hours = duration / (1000 * 60 * 60);
          return sum + (d.costPerHour * hours);
        }
        return sum;
      }, 0);
      
      setStats({
        activeDeployments: active.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalDeployments: MOCK_DEPLOYMENTS.length,
        escrowBalance: 125.50 // Mock balance
      });
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Initial load
  useEffect(() => {
    if (isConnected && address) {
      fetchDeployments();
    }
  }, [isConnected, address, fetchDeployments]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      fetchDeployments();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, fetchDeployments]);

  const handleViewLogs = useCallback(async (deploymentId: string) => {
    setSelectedDeployment(deploymentId);
    setShowLogDialog(true);
    setIsLoadingLogs(true);
    
    try {
      // TODO: Connect to real SSE endpoint
      // const eventSource = new EventSource(`/api/deployments/${deploymentId}/logs?follow=true`);
      
      // Mock logs for now
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogs([
        `[${new Date().toISOString()}] Starting deployment...`,
        `[${new Date().toISOString()}] Pulling image pytorch/pytorch:latest`,
        `[${new Date().toISOString()}] Image pulled successfully`,
        `[${new Date().toISOString()}] Creating container...`,
        `[${new Date().toISOString()}] Container started`,
        `[${new Date().toISOString()}] Service available at http://192.168.1.100:8888`,
        `[${new Date().toISOString()}] Ready for connections`
      ]);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs(['Error: Failed to fetch logs']);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const handleCloseDeployment = useCallback(async (deploymentId: string) => {
    if (!confirm('Are you sure you want to close this deployment?')) {
      return;
    }

    try {
      // TODO: Replace with real API call
      // await fetch(`/api/deployments/${deploymentId}`, {
      //   method: 'DELETE',
      //   headers: { 'x-user-address': address || '' }
      // });

      // Update local state
      setDeployments(prev => 
        prev.map(d => 
          d.id === deploymentId 
            ? { ...d, status: 'closed' as const, expiresAt: new Date().toISOString() }
            : d
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeDeployments: Math.max(0, prev.activeDeployments - 1)
      }));
    } catch (error) {
      console.error('Failed to close deployment:', error);
      alert('Failed to close deployment. Please try again.');
    }
  }, [address]);

  // Redirect if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the buyer dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => router.push('/')}>
              <Wallet className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buyer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your compute deployments and escrow
          </p>
        </div>
        <Button onClick={() => router.push('/submit-job')}>
          <Plus className="mr-2 h-4 w-4" />
          New Deployment
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Deployments"
          value={stats.activeDeployments.toString()}
          description="Currently running"
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Spent"
          value={`$${stats.totalSpent.toFixed(2)}`}
          description="Lifetime spending"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Escrow Balance"
          value={`$${stats.escrowBalance.toFixed(2)}`}
          description="Available for deployments"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          action={
            <Button variant="ghost" size="sm" className="h-6 px-2">
              Add Funds
            </Button>
          }
        />
        <StatsCard
          title="Total Deployments"
          value={stats.totalDeployments.toString()}
          description="All time"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Deployments List */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              <DeploymentList
                deployments={deployments.filter(d => d.status === 'active')}
                isLoading={isLoading}
                onRefresh={fetchDeployments}
                onViewLogs={handleViewLogs}
                onCloseDeployment={handleCloseDeployment}
              />
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4">
              <DeploymentList
                deployments={deployments}
                isLoading={isLoading}
                onRefresh={fetchDeployments}
                onViewLogs={handleViewLogs}
                onCloseDeployment={handleCloseDeployment}
              />
            </TabsContent>
            
            <TabsContent value="closed" className="space-y-4">
              <DeploymentList
                deployments={deployments.filter(d => d.status === 'closed')}
                isLoading={isLoading}
                onRefresh={fetchDeployments}
                onViewLogs={handleViewLogs}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/submit-job')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Submit New Job
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/providers')}
              >
                <Server className="mr-2 h-4 w-4" />
                Browse Providers
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                disabled
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Add Escrow Funds
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  title="Deployment Created"
                  description="pytorch-gpu is now active"
                  time="2 hours ago"
                  icon={<Server className="h-4 w-4" />}
                />
                <ActivityItem
                  title="Deployment Closed"
                  description="nginx-web has been closed"
                  time="1 day ago"
                  icon={<AlertCircle className="h-4 w-4" />}
                />
                <ActivityItem
                  title="Escrow Deposit"
                  description="Added $100.00 to escrow"
                  time="2 days ago"
                  icon={<DollarSign className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Viewer Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Deployment Logs
            </DialogTitle>
            <DialogDescription>
              {selectedDeployment}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 overflow-auto max-h-[50vh]">
              {isLoadingLogs ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading logs...
                </div>
              ) : logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="py-0.5">
                    {log}
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">No logs available</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}

function StatsCard({ title, value, description, icon, action }: StatsCardProps): JSX.Element {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{description}</p>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
}

function ActivityItem({ title, description, time, icon }: ActivityItemProps): JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

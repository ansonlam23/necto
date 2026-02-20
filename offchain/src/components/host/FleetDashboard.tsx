'use client';

import { useState, useEffect } from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import type { HostedMachine } from '@/types/marketplace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Power,
  DollarSign,
  Clock,
  TrendingUp,
  Server,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function FleetDashboard() {
  const { hostedMachines, deleteMachine, toggleMachineStatus } = useMarketplace();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [simulatedEarnings, setSimulatedEarnings] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleDelete = (id: string) => {
    deleteMachine(id);
    toast.success('Machine removed from fleet');
  };

  const handleToggleStatus = (id: string) => {
    toggleMachineStatus(id);
    const machine = hostedMachines.find(m => m.id === id);
    const newStatus = machine?.availability.status === 'online' ? 'offline' : 'online';
    toast.success(`Machine is now ${newStatus}`);
  };

  // Calculate fleet statistics
  const totalMachines = hostedMachines.length;
  const activeMachines = hostedMachines.filter(m => m.availability.status === 'online').length;
  const totalEarnings = hostedMachines.reduce((sum, m) => sum + m.metadata.totalEarnings, 0) + simulatedEarnings;
  const totalHours = hostedMachines.reduce((sum, m) => sum + m.metadata.totalHours, 0);

  // Simulate earnings for active machines
  useEffect(() => {
    if (isSimulating && activeMachines > 0) {
      const interval = setInterval(() => {
        const earningsPerSecond = hostedMachines
          .filter(m => m.availability.status === 'online')
          .reduce((sum, m) => sum + (m.pricing.hourlyRate / 3600), 0);

        setSimulatedEarnings(prev => prev + earningsPerSecond);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isSimulating, activeMachines, hostedMachines]);

  const getStatusColor = (status: HostedMachine['availability']['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
    }
  };

  const getStatusBadge = (status: HostedMachine['availability']['status']) => {
    switch (status) {
      case 'online': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Online</Badge>;
      case 'offline': return <Badge variant="secondary">Offline</Badge>;
      case 'maintenance': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Maintenance</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      {activeMachines > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isSimulating ? "bg-green-500/10" : "bg-muted"
            )}>
              <TrendingUp className={cn(
                "h-5 w-5",
                isSimulating ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium">Earnings Simulation</p>
              <p className="text-sm text-muted-foreground">
                {isSimulating
                  ? `Simulating earnings for ${activeMachines} active machine${activeMachines > 1 ? 's' : ''}`
                  : 'Start simulation to see projected earnings'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {simulatedEarnings > 0 && (
              <Badge variant="secondary" className="font-mono">
                +${simulatedEarnings.toFixed(4)}
              </Badge>
            )}
            <Button
              variant={isSimulating ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                setIsSimulating(!isSimulating);
                if (isSimulating) setSimulatedEarnings(0);
              }}
            >
              {isSimulating ? 'Stop' : 'Start'} Simulation
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Machines</p>
              <p className="text-2xl font-bold">{totalMachines}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeMachines}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">
                ${totalEarnings.toFixed(2)}
                {isSimulating && (
                  <span className="text-xs text-green-500 ml-1 animate-pulse">↑</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{totalHours}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Overview */}
      {hostedMachines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fleet Utilization</CardTitle>
            <CardDescription>Current resource allocation across your fleet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* GPU Utilization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">GPU Resources</span>
                  <span className="font-medium">
                    {activeMachines} / {totalMachines} machines online
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${totalMachines > 0 ? (activeMachines / totalMachines) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Earnings Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium text-green-600">
                    ${hostedMachines
                      .filter(m => m.availability.status === 'online')
                      .reduce((sum, m) => sum + m.pricing.hourlyRate, 0)
                      .toFixed(2)}/hr
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Daily Potential</p>
                    <p className="font-medium">
                      ${(hostedMachines
                        .filter(m => m.availability.status === 'online')
                        .reduce((sum, m) => sum + m.pricing.hourlyRate * 24, 0))
                        .toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Monthly Potential</p>
                    <p className="font-medium">
                      ${(hostedMachines
                        .filter(m => m.availability.status === 'online')
                        .reduce((sum, m) => sum + m.pricing.hourlyRate * 24 * 30, 0))
                        .toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Fleet</CardTitle>
          <CardDescription>
            Manage your listed compute resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hostedMachines.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No machines listed yet</h3>
              <p className="text-muted-foreground text-sm">
                List your first machine to start earning
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Hardware</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostedMachines.map((machine) => (
                  <TableRow
                    key={machine.id}
                    className={cn(
                      "transition-colors",
                      selectedMachine === machine.id && "bg-muted/50"
                    )}
                    onClick={() => setSelectedMachine(machine.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          getStatusColor(machine.availability.status)
                        )} />
                        {getStatusBadge(machine.availability.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{machine.name}</p>
                        <p className="text-xs text-muted-foreground">{machine.institutionName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {machine.hardware.gpuCount}x {machine.hardware.gpuModel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {machine.hardware.cpuCores} CPU • {machine.hardware.ram}GB RAM
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-green-600">
                          ${machine.pricing.hourlyRate}/hr
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Min: {machine.pricing.minimumRentalHours}h
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {machine.availability.region}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium">
                          ${machine.metadata.totalEarnings.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {machine.metadata.totalHours}h total
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={machine.availability.status === 'online'}
                          onCheckedChange={() => handleToggleStatus(machine.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(machine.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Machine
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
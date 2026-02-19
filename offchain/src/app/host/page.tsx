'use client';

import { useState } from 'react';
import { ListingForm } from '@/components/host/ListingForm';
import { FleetDashboard } from '@/components/host/FleetDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Server, TrendingUp, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HostPage() {
  const [activeTab, setActiveTab] = useState('list');

  const handleListingSuccess = () => {
    // Switch to fleet tab after successful listing
    setActiveTab('fleet');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Host Your Compute</h1>
        <p className="text-muted-foreground">
          Monetize your idle GPU resources by making them available to researchers and developers
        </p>
      </div>


      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <Upload className="h-4 w-4" />
            List Machine
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-2">
            <Server className="h-4 w-4" />
            My Fleet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <ListingForm onSuccess={handleListingSuccess} />
        </TabsContent>

        <TabsContent value="fleet" className="space-y-6">
          <FleetDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
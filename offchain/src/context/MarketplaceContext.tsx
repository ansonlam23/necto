'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { HostedMachine, MarketplaceState } from '@/types/marketplace';
import type { SynapseProvider } from '@/lib/providers/akash-fetcher';

const STORAGE_KEY = 'necto_hosted_machines';

const MarketplaceContext = createContext<MarketplaceState | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [hostedMachines, setHostedMachines] = useState<HostedMachine[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const machines = JSON.parse(stored);
        setHostedMachines(machines);
      } catch (error) {
        console.error('Failed to load hosted machines from storage:', error);
      }
    }
  }, []);

  // Save to localStorage whenever machines change
  useEffect(() => {
    if (hostedMachines.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hostedMachines));
    }
  }, [hostedMachines]);

  const addMachine = useCallback((machine: Omit<HostedMachine, 'id' | 'metadata'>) => {
    const newMachine: HostedMachine = {
      ...machine,
      id: `host-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalEarnings: 0,
        totalHours: 0,
        isVerified: Math.random() > 0.3, // 70% chance of being "verified"
      },
    };
    setHostedMachines(prev => [...prev, newMachine]);
  }, []);

  const updateMachine = useCallback((id: string, updates: Partial<HostedMachine>) => {
    setHostedMachines(prev =>
      prev.map(machine => {
        if (machine.id === id) {
          return {
            ...machine,
            ...updates,
            metadata: {
              ...machine.metadata,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return machine;
      })
    );
  }, []);

  const deleteMachine = useCallback((id: string) => {
    setHostedMachines(prev => prev.filter(machine => machine.id !== id));
  }, []);

  const toggleMachineStatus = useCallback((id: string) => {
    setHostedMachines(prev =>
      prev.map(machine => {
        if (machine.id === id) {
          const currentStatus = machine.availability.status;
          const newStatus = currentStatus === 'online' ? 'offline' : 'online';
          return {
            ...machine,
            availability: {
              ...machine.availability,
              status: newStatus,
            },
            metadata: {
              ...machine.metadata,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return machine;
      })
    );
  }, []);

  const getMachineById = useCallback((id: string) => {
    return hostedMachines.find(machine => machine.id === id);
  }, [hostedMachines]);

  const getActiveMachines = useCallback(() => {
    return hostedMachines.filter(machine => machine.availability.status === 'online');
  }, [hostedMachines]);

  const convertToSynapseProviders = useCallback((): SynapseProvider[] => {
    return getActiveMachines().map(machine => ({
      id: machine.id,
      name: `${machine.institutionName} - ${machine.name}`,
      source: 'User-Listed' as any,
      hardware: {
        gpuModel: machine.hardware.gpuModel,
        gpuCount: machine.hardware.gpuCount,
        cpuUnits: machine.hardware.cpuCores * 1000, // Convert cores to milli-units
        cpuCount: machine.hardware.cpuCores,
        memory: machine.hardware.ram * 1024 * 1024 * 1024, // Convert GB to bytes
        memoryGB: machine.hardware.ram,
        storage: (machine.hardware.storage || 100) * 1024 * 1024 * 1024, // Convert GB to bytes
        storageGB: machine.hardware.storage || 100,
      },
      priceEstimate: machine.pricing.hourlyRate,
      uptimePercentage: machine.performance.uptime,
      region: machine.availability.region,
      attributes: {
        verified: machine.metadata.isVerified || false,
        institution: machine.institutionName,
        minimumHours: machine.pricing.minimumRentalHours,
        schedule: machine.availability.schedule,
      } as any,
    }));
  }, [getActiveMachines]);

  const value: MarketplaceState = {
    hostedMachines,
    addMachine,
    updateMachine,
    deleteMachine,
    toggleMachineStatus,
    getMachineById,
    getActiveMachines,
    convertToSynapseProviders,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
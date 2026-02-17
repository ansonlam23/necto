"use client"

import { useWorkflowStore } from '@/lib/workflow-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

export function ConfigPanel() {
  const { selectedNode, updateNodeConfig, selectNode } = useWorkflowStore()

  if (!selectedNode) {
    return (
      <div className="w-80 bg-card border-l border-border h-full p-4">
        <div className="text-center text-muted-foreground mt-8">
          <p className="text-sm">Select a node to configure its properties</p>
        </div>
      </div>
    )
  }

  const handleConfigChange = (key: string, value: string) => {
    updateNodeConfig(selectedNode.id, { [key]: value })
  }

  const renderConfigFields = () => {
    const label = selectedNode.data.label as string | undefined

    switch (label) {
      case 'AI Router':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <Select onValueChange={(value) => handleConfigChange('model', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama-3">Llama-3</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3">Claude-3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select onValueChange={(value) => handleConfigChange('strategy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowest-price">Lowest Price</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'Compliance Gate':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="kyc-level">KYC Level</Label>
              <Select onValueChange={(value) => handleConfigChange('kycLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select KYC level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                  <SelectItem value="institutional">Institutional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="iso-required">ISO Certification</Label>
              <Select onValueChange={(value) => handleConfigChange('isoRequired', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="ISO requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Required</SelectItem>
                  <SelectItem value="iso27001">ISO 27001</SelectItem>
                  <SelectItem value="iso9001">ISO 9001</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'Budget Guard':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="max-spend">Max Spend (USD)</Label>
              <Input
                id="max-spend"
                type="number"
                placeholder="1000"
                onChange={(e) => handleConfigChange('maxSpend', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="alert-threshold">Alert Threshold (%)</Label>
              <Input
                id="alert-threshold"
                type="number"
                placeholder="80"
                max="100"
                onChange={(e) => handleConfigChange('alertThreshold', e.target.value)}
              />
            </div>
          </div>
        )

      case 'Schedule (Cron)':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cron-expression">Cron Expression</Label>
              <Input
                id="cron-expression"
                placeholder="0 */6 * * *"
                onChange={(e) => handleConfigChange('cronExpression', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select onValueChange={(value) => handleConfigChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="est">EST</SelectItem>
                  <SelectItem value="pst">PST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="node-name">Node Name</Label>
              <Input
                id="node-name"
                defaultValue={label ?? ''}
                onChange={(e) => handleConfigChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Node description"
                onChange={(e) => handleConfigChange('description', e.target.value)}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-80 bg-card border-l border-border h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg">Configuration</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectNode(null)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <Card className="border-sidebar-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {String(selectedNode.data.label ?? '')}
            </CardTitle>
            <p className="text-xs text-muted-foreground capitalize">
              {selectedNode.category} Node
            </p>
          </CardHeader>
          <CardContent>
            {renderConfigFields()}
          </CardContent>
        </Card>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>Node ID: <span className="terminal-data">{selectedNode.id}</span></p>
          <p>Position: <span className="terminal-data">
            {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}
          </span></p>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ConfigPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedNode: any
  updateNodeConfig: (nodeId: string, config: any) => void
}

// Configuration schemas for each node type
const nodeConfigs: Record<string, any> = {
  // Triggers
  webhook: {
    fields: [
      { name: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
      { name: 'authType', label: 'Auth Type', type: 'select', options: ['None', 'Bearer', 'API Key'], default: 'None' },
      { name: 'rateLimit', label: 'Rate Limit (req/min)', type: 'number', default: '60' },
    ],
  },
  schedule: {
    fields: [
      { name: 'cronExpression', label: 'Cron Expression', type: 'text', placeholder: '0 */5 * * *' },
      { name: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'EST', 'PST', 'CET'], default: 'UTC' },
    ],
  },
  'onchain-event': {
    fields: [
      { name: 'chain', label: 'Chain', type: 'select', options: ['Akash', 'Ethereum', 'Polygon'], default: 'Akash' },
      { name: 'contractAddress', label: 'Contract Address', type: 'text', placeholder: '0x...' },
      { name: 'eventName', label: 'Event Name', type: 'text', placeholder: 'Transfer' },
    ],
  },
  'api-call': {
    fields: [
      { name: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com' },
      { name: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}' },
      { name: 'timeout', label: 'Timeout (ms)', type: 'number', default: '5000' },
    ],
  },
  'file-upload': {
    fields: [
      { name: 'maxSize', label: 'Max Size (MB)', type: 'number', default: '10' },
      { name: 'allowedTypes', label: 'Allowed Types', type: 'select', options: ['CSV', 'JSON', 'Model', 'All'], default: 'All' },
    ],
  },

  // Logic
  'ai-router': {
    fields: [
      { name: 'model', label: 'Model', type: 'select', options: ['GPT-4o', 'Claude', 'Llama-3'], default: 'GPT-4o' },
      { name: 'promptTemplate', label: 'Prompt Template', type: 'textarea', placeholder: 'Analyze: {{input}}' },
      { name: 'outputFormat', label: 'Output Format', type: 'select', options: ['JSON', 'Text', 'Markdown'], default: 'JSON' },
    ],
  },
  'compliance-gate': {
    fields: [
      { name: 'regionLock', label: 'Region Lock', type: 'select', options: ['None', 'US', 'EU', 'Asia'], default: 'None' },
      { name: 'kycRequired', label: 'KYC Required', type: 'select', options: ['true', 'false'], default: 'false' },
    ],
  },
  'budget-guard': {
    fields: [
      { name: 'maxCost', label: 'Max Cost ($)', type: 'number', placeholder: '100' },
      { name: 'action', label: 'Action', type: 'select', options: ['Reject', 'Notify', 'Queue'], default: 'Reject' },
    ],
  },
  'data-filter': {
    fields: [
      { name: 'fieldName', label: 'Field Name', type: 'text', placeholder: 'status' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['Equals', 'Contains', 'Greater', 'Less'], default: 'Equals' },
      { name: 'value', label: 'Value', type: 'text', placeholder: 'active' },
    ],
  },
  transformer: {
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['JSON2CSV', 'Replace', 'Custom'], default: 'JSON2CSV' },
      { name: 'codeSnippet', label: 'Code Snippet', type: 'textarea', placeholder: 'return data.map(...)' },
    ],
  },
  aggregator: {
    fields: [
      { name: 'batchSize', label: 'Batch Size', type: 'number', default: '10' },
      { name: 'timeWindow', label: 'Time Window (sec)', type: 'number', default: '60' },
    ],
  },

  // Providers
  'akash-network': {
    fields: [
      { name: 'sdl', label: 'SDL Configuration', type: 'textarea', placeholder: 'version: "2.0"\nservices:...' },
      { name: 'maxPrice', label: 'Max Price (uAKT)', type: 'number', placeholder: '1000' },
      { name: 'attributes', label: 'Attributes', type: 'text', placeholder: 'vendor=nvidia' },
    ],
  },
  render: {
    fields: [
      { name: 'sceneFileUrl', label: 'Scene File URL', type: 'text', placeholder: 'https://...' },
      { name: 'quality', label: 'Quality', type: 'select', options: ['Draft', 'Production', 'Ultra'], default: 'Production' },
    ],
  },
  'io-net': {
    fields: [
      { name: 'clusterId', label: 'Cluster ID', type: 'text', placeholder: 'cluster-123' },
      { name: 'os', label: 'Operating System', type: 'select', options: ['Ubuntu', 'Debian', 'Windows'], default: 'Ubuntu' },
      { name: 'gpuType', label: 'GPU Type', type: 'select', options: ['RTX 4090', 'A100', 'H100'], default: 'RTX 4090' },
    ],
  },
  'lambda-labs': {
    fields: [
      { name: 'instanceType', label: 'Instance Type', type: 'select', options: ['gpu_1x_a100', 'gpu_8x_a100'], default: 'gpu_1x_a100' },
      { name: 'region', label: 'Region', type: 'select', options: ['us-east-1', 'us-west-2', 'eu-central-1'], default: 'us-east-1' },
      { name: 'sshKey', label: 'SSH Key', type: 'textarea', placeholder: 'ssh-rsa AAAA...' },
    ],
  },
  'vast-ai': {
    fields: [
      { name: 'diskSpace', label: 'Disk Space (GB)', type: 'number', default: '100' },
      { name: 'reliabilityScore', label: 'Min Reliability Score', type: 'number', default: '95' },
    ],
  },
  runpod: {
    fields: [
      { name: 'podType', label: 'Pod Type', type: 'select', options: ['Community', 'Secure'], default: 'Secure' },
      { name: 'volumeMount', label: 'Volume Mount Path', type: 'text', placeholder: '/workspace' },
    ],
  },

  // Settlement
  'usdc-payment': {
    fields: [
      { name: 'recipientAddress', label: 'Recipient Address', type: 'text', placeholder: '0x...' },
      { name: 'amount', label: 'Amount (USDC)', type: 'number', placeholder: '100' },
      { name: 'chain', label: 'Chain', type: 'select', options: ['Ethereum', 'Polygon', 'Arbitrum'], default: 'Polygon' },
    ],
  },
  'audit-log': {
    fields: [
      { name: 'dataToLog', label: 'Data to Log', type: 'textarea', placeholder: 'JSON data structure' },
      { name: 'encryption', label: 'Encryption', type: 'select', options: ['true', 'false'], default: 'true' },
    ],
  },
  notification: {
    fields: [
      { name: 'channel', label: 'Channel', type: 'select', options: ['Email', 'Discord', 'Slack', 'Telegram'], default: 'Email' },
      { name: 'template', label: 'Template', type: 'textarea', placeholder: 'Workflow completed: {{status}}' },
    ],
  },
  'database-write': {
    fields: [
      { name: 'tableName', label: 'Table Name', type: 'text', placeholder: 'workflow_logs' },
      { name: 'dataObject', label: 'Data Object', type: 'textarea', placeholder: '{"key": "value"}' },
    ],
  },
  'webhook-out': {
    fields: [
      { name: 'url', label: 'URL', type: 'text', placeholder: 'https://webhook.site/...' },
      { name: 'retries', label: 'Max Retries', type: 'number', default: '3' },
    ],
  },
}

export function ConfigPanel({ isOpen, onClose, selectedNode, updateNodeConfig }: ConfigPanelProps) {
  const [config, setConfig] = useState<any>({})

  useEffect(() => {
    if (selectedNode?.data?.config) {
      setConfig(selectedNode.data.config)
    } else {
      setConfig({})
    }
  }, [selectedNode])

  if (!selectedNode) return null

  const nodeType = selectedNode.data?.type
  const nodeConfig = nodeConfigs[nodeType]

  if (!nodeConfig) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{selectedNode.data?.label}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              No configuration available for this node type.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    const newConfig = { ...config, [fieldName]: value }
    setConfig(newConfig)
  }

  const handleSave = () => {
    updateNodeConfig(selectedNode.id, config)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{selectedNode.data?.label} Configuration</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Configure the properties for this node
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh] pr-4">
          <div className="space-y-4">
            {nodeConfig.fields.map((field: any) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                </Label>

                {field.type === 'text' && (
                  <Input
                    id={field.name}
                    type="text"
                    placeholder={field.placeholder}
                    value={config[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full"
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder || field.default}
                    value={config[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    id={field.name}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    placeholder={field.placeholder}
                    value={config[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  />
                )}

                {field.type === 'select' && (
                  <Select
                    value={config[field.name] || field.default}
                    onValueChange={(value) => handleFieldChange(field.name, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button onClick={handleSave} className="px-6">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
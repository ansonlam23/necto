'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequirementsChecklist } from '@/components/agent/RequirementsChecklist';
import { DeployModal } from '@/components/agent/DeployModal';
import { Send, Bot, Sparkles, Server, Cpu, Gamepad2, Image, Database, CheckCircle2, Loader2, Rocket, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeploymentConfig, DeploymentScenario } from '@/types/deployment';
import type { DeployCompleteInfo } from '@/components/agent/DeployModal';
import { useAuditStore } from '@/lib/audit-store';

// AI SDK v5 tool parts are typed by tool name — use a local shape to avoid `any`
interface ToolPart {
  type: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

const agentTransport = new DefaultChatTransport({ api: '/api/agent-chat' });

const TOOL_LABELS: Record<string, string> = {
  proposeDeployment: 'Analyzing workload requirements...',
  searchAkash: 'Searching provider network...',
  lookupDocs: 'Consulting documentation...',
  generateSDL: 'Generating deployment manifest...',
};

export default function AgentPage() {
  const [inputValue, setInputValue] = useState('');
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [deployMessage, setDeployMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addAuditEntry = useAuditStore(state => state.addEntry);

  const { messages, sendMessage, status, error } = useChat({
    transport: agentTransport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Derived: extract DeploymentConfig from the most recent proposeDeployment result
  const deploymentConfig = useMemo<DeploymentConfig>(() => {
    for (const msg of [...messages].reverse()) {
      if (msg.role !== 'assistant') continue;
      for (const part of msg.parts ?? []) {
        const p = part as unknown as ToolPart;
        if (p.type === 'tool-proposeDeployment' && p.state === 'output-available') {
          const config = (p.output as { config?: DeploymentConfig } | undefined)?.config;
          if (config) return config;
        }
      }
    }
    return {};
  }, [messages]);

  // Derived: whether searchAkash has returned a successful provider
  const providerFound = useMemo<boolean>(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      for (const part of msg.parts ?? []) {
        const p = part as unknown as ToolPart;
        if (p.type === 'tool-searchAkash' && p.state === 'output-available') {
          if ((p.output as { success?: boolean } | undefined)?.success) return true;
        }
      }
    }
    return false;
  }, [messages]);

  // Derived: thinking steps from in-flight tool calls while streaming
  const thinkingSteps = useMemo(() => {
    if (!isLoading) return [];
    const lastMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const toolParts = (lastMsg?.parts ?? [])
      .map(p => p as unknown as ToolPart)
      .filter(p => p.type?.startsWith('tool-'));

    const steps = toolParts.map(p => ({
      id: p.type.replace('tool-', ''),
      label: TOOL_LABELS[p.type.replace('tool-', '')] ?? p.type.replace('tool-', ''),
      status: (p.state === 'output-available' ? 'complete' : 'active') as 'pending' | 'active' | 'complete',
    }));

    if (steps.length === 0) {
      steps.push({ id: 'init', label: 'Processing request...', status: 'active' });
    }
    return steps;
  }, [messages, isLoading]);

  const scenarios: DeploymentScenario[] = [
    {
      id: 'pytorch',
      title: 'PyTorch GPU Training',
      description: 'NVIDIA GPU-optimized PyTorch environment for ML training',
      prompt: 'I want PyTorch GPU Training — NVIDIA GPU-optimized PyTorch environment for ML training',
      icon: 'cpu',
      color: 'text-purple-500',
      defaults: {},
    },
    {
      id: 'minecraft',
      title: 'Minecraft Server',
      description: 'Host a multiplayer game server',
      prompt: 'I want to host a Minecraft server for my friends',
      icon: 'gamepad',
      color: 'text-green-500',
      defaults: {},
    },
    {
      id: 'stable-diffusion',
      title: 'Image Generation',
      description: 'Run Stable Diffusion or DALL-E',
      prompt: 'Deploy Stable Diffusion for image generation',
      icon: 'image',
      color: 'text-pink-500',
      defaults: {},
    },
    {
      id: 'web-server',
      title: 'Web Application',
      description: 'Deploy nginx or Node.js apps',
      prompt: 'I need to deploy a web server with nginx',
      icon: 'server',
      color: 'text-blue-500',
      defaults: {},
    },
    {
      id: 'database',
      title: 'Database Server',
      description: 'PostgreSQL, MySQL, MongoDB',
      prompt: 'Set up a PostgreSQL database server',
      icon: 'database',
      color: 'text-orange-500',
      defaults: {},
    },
    {
      id: 'custom',
      title: 'Custom Workload',
      description: 'Describe your specific needs',
      prompt: '',
      icon: 'sparkles',
      color: 'text-indigo-500',
      defaults: {},
    },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  const handleScenarioClick = (scenario: DeploymentScenario) => {
    if (scenario.prompt) {
      setInputValue(scenario.prompt);
    }
    inputRef.current?.focus();
  };

  const EXPLORER_URL = 'https://explorer.ab.testnet.adifoundation.ai';

  const handleDeployComplete = (info: DeployCompleteInfo) => {
    const lines: string[] = ['Deployment is live on Akash Network!\n'];

    if (info.akashUrl) {
      lines.push(`Akash Console:\n  ${info.akashUrl}`);
    }
    if (info.serviceUris.length > 0) {
      lines.push(`Service URL${info.serviceUris.length > 1 ? 's' : ''}:\n${info.serviceUris.map(u => `  ${u}`).join('\n')}`);
    }
    if (info.transferTxHash) {
      lines.push(`USDC Transfer (ADI Explorer):\n  ${EXPLORER_URL}/tx/${info.transferTxHash}`);
    }
    if (info.submitJobTxHash) {
      lines.push(`Escrow Job (ADI Explorer):\n  ${EXPLORER_URL}/tx/${info.submitJobTxHash}`);
    }

    setDeployMessage(lines.join('\n\n'));

    addAuditEntry({
      type: 'deployment',
      provider: 'Akash',
      deploymentId: info.deploymentId,
      akashUrl: info.akashUrl,
      transferTxHash: info.transferTxHash,
      submitJobTxHash: info.submitJobTxHash,
      serviceUris: info.serviceUris,
      explorerBaseUrl: EXPLORER_URL,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, deployMessage]);

  const getScenarioIcon = (iconName: string) => {
    switch (iconName) {
      case 'gamepad': return Gamepad2;
      case 'cpu': return Cpu;
      case 'image': return Image;
      case 'server': return Server;
      case 'database': return Database;
      case 'sparkles': return Sparkles;
      default: return Server;
    }
  };

  // Extract plain text from a message's parts (AI SDK v5 uses parts instead of content)
  const getMessageText = (msg: typeof messages[0]) => {
    const parts = (msg.parts ?? []) as Array<{ type: string; text?: string }>;
    const textParts = parts.filter(p => p.type === 'text' && typeof p.text === 'string');
    if (textParts.length > 0) return textParts.map(p => p.text!).join('');
    // Fallback: if user message has no parts, use content (older format)
    const content = (msg as unknown as { content?: string }).content;
    if (msg.role === 'user' && typeof content === 'string') return content;
    return '';
  };

  const hasMessages = messages.length > 0 || isLoading || !!error;

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)] flex gap-6">

      {/* Left Sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 space-y-4 overflow-y-auto">
        <RequirementsChecklist config={deploymentConfig} />
        <Button
          disabled={!providerFound}
          onClick={() => setIsDeployOpen(true)}
          className={cn(
            "w-full gap-2 transition-all duration-300",
            providerFound
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
          )}
        >
          <Rocket className="h-4 w-4" />
          Deploy
        </Button>
      </div>

      {/* Chat Card — fills remaining width, fixed height inherited from parent */}
      <Card className="flex-1 flex flex-col overflow-hidden bg-card/30 backdrop-blur border-border/50">

        {/* Messages — the ONLY scrollable area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasMessages ? (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  What would you like to deploy today?
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Just describe your workload and I&apos;ll configure everything automatically
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {scenarios.map((scenario) => {
                  const Icon = getScenarioIcon(scenario.icon);
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => handleScenarioClick(scenario)}
                      className="group relative p-4 rounded-xl border border-border/50 bg-card/20 hover:bg-card/40 hover:border-primary/30 transition-all duration-200 text-left"
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={cn(
                          "p-3 rounded-lg bg-background/50 group-hover:scale-110 transition-transform",
                          scenario.color
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{scenario.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {scenario.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const text = getMessageText(message);
                if (!text) return null;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-xl px-4 py-2.5 max-w-[80%]",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 border border-border/50'
                    )}>
                      <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                        {text}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Deploy complete confirmation */}
              {deployMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {deployMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Thinking / processing bubble */}
              {isLoading && thinkingSteps.length > 0 && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/30 border border-border/50 rounded-xl px-4 py-3 space-y-2.5 min-w-[240px]">
                    {thinkingSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2.5">
                        {step.status === 'complete' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : step.status === 'active' ? (
                          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/25 flex-shrink-0" />
                        )}
                        <span className={cn(
                          "text-xs transition-colors duration-200",
                          step.status === 'complete'
                            ? "text-green-500"
                            : step.status === 'active'
                              ? "text-foreground"
                              : "text-muted-foreground/40"
                        )}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error bubble */}
              {error && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 max-w-[80%]">
                    <p className="text-xs font-semibold text-destructive mb-0.5">Agent error</p>
                    <p className="text-sm text-destructive/80 font-mono">
                      {error.message}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input — always pinned to bottom */}
        <div className="shrink-0 p-4 border-t border-border/50">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Describe what you want to deploy..."
              disabled={isLoading}
              className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>

      <DeployModal open={isDeployOpen} onClose={() => setIsDeployOpen(false)} config={deploymentConfig} onDeployComplete={handleDeployComplete} />
    </div>
  );
}

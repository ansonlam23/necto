'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, Sparkles, AlertCircle, Server, Cpu, HardDrive, Activity, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeploymentRequirements {
  dockerImage?: string | null;
  cpu?: string | null;
  memory?: string | null;
  storage?: string | null;
  gpu?: string | null;
  port?: number | string | null;
  region?: string | null;
}

interface ProviderRecommendation {
  name: string;
  id: string;
  price: number;
  uptime: number;
  hardware: {
    gpuModel?: string;
    gpuCount?: number;
    cpuCount?: number;
    memoryGB?: number;
    storageGB?: number;
  };
  region?: string;
  reason?: string;
}

export default function AgentPage() {
  const [requirements, setRequirements] = useState<DeploymentRequirements>({
    dockerImage: null,
    cpu: null,
    memory: null,
    storage: null,
    gpu: null,
    port: null,
  });
  const [recommendation, setRecommendation] = useState<ProviderRecommendation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const { messages, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent-chat',
    }),
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await sendMessage({ text: input });
      setInput('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const exampleScenarios = [
    {
      title: 'Web Server',
      specs: 'I need nginx with 2 CPU, 4Gi RAM, 10Gi storage, port 80',
      icon: Server,
      color: 'text-blue-500',
    },
    {
      title: 'AI Workload',
      specs: 'Deploy pytorch/pytorch with H100 GPU, 8 CPU, 32Gi RAM',
      icon: Cpu,
      color: 'text-purple-500',
    },
    {
      title: 'Database',
      specs: 'Run postgres:15 with 4 CPU, 8Gi RAM, 50Gi storage',
      icon: HardDrive,
      color: 'text-green-500',
    },
    {
      title: 'Node.js',
      specs: 'Deploy node:18 with 1 CPU, 2Gi RAM, port 3000',
      icon: Activity,
      color: 'text-orange-500',
    },
  ];

  const handleScenarioClick = (specs: string) => {
    setInput(specs);
  };

  const hasApiKeyError = error?.message?.includes('Gemini API key');

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.role === 'assistant') {
        msg.parts?.forEach(part => {
          if (part.type === 'tool-result' && part.result) {
            const result = part.result as any;

            if (result.requirementUpdate?.allRequirements) {
              setRequirements(result.requirementUpdate.allRequirements);
              const { dockerImage, cpu, memory, storage } = result.requirementUpdate.allRequirements;
              if (dockerImage && cpu && memory && storage && result.readyToSearch) {
                setIsSearching(true);
              }
            }

            if (result.recommendation && result.topProviders?.length > 0) {
              const topProvider = result.topProviders[0];
              setRecommendation({
                name: topProvider.name,
                id: topProvider.id,
                price: topProvider.pricePerHour,
                uptime: topProvider.uptime,
                hardware: {
                  gpuModel: topProvider.gpuModel,
                  gpuCount: topProvider.gpuCount,
                  cpuCount: topProvider.cpuCount,
                  memoryGB: topProvider.memoryGB,
                  storageGB: topProvider.storageGB,
                },
                region: topProvider.region,
                reason: result.recommendation.reason,
              });
              setIsSearching(false);
            }
          }
        });
      }
    });
  }, [messages]);

  const requirementsList = [
    { key: 'dockerImage', label: 'Docker Image', value: requirements.dockerImage },
    { key: 'cpu', label: 'CPU', value: requirements.cpu },
    { key: 'memory', label: 'Memory', value: requirements.memory },
    { key: 'storage', label: 'Storage', value: requirements.storage },
    { key: 'gpu', label: 'GPU', value: requirements.gpu, optional: true },
    { key: 'port', label: 'Port', value: requirements.port, optional: true },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">AI Infrastructure Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Get personalized Akash Network provider recommendations
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col bg-card/50 backdrop-blur border-border/50">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6">
              {hasApiKeyError ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <AlertCircle className="h-10 w-10 text-yellow-500/70 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">API key not configured</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    GOOGLE_GENERATIVE_AI_API_KEY
                  </code>
                </div>
              ) : messages.length === 0 ? (
                <div className="space-y-8">
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">How can I help you deploy today?</h2>
                    <p className="text-sm text-muted-foreground">
                      Describe your requirements and I'll find the perfect provider
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {exampleScenarios.map((scenario, i) => {
                      const Icon = scenario.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => handleScenarioClick(scenario.specs)}
                          className="group relative p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-border transition-all duration-200 text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg bg-background/50", scenario.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">{scenario.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {scenario.specs}
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-xl px-4 py-2.5 max-w-[80%]",
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 border border-border/50'
                        )}
                      >
                        <div className="text-sm">
                          {message.parts?.map((part, i) => {
                            if (part.type === 'text') {
                              return <span key={i}>{part.text}</span>;
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Form */}
            <div className="p-4 border-t border-border/50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your deployment needs..."
                  disabled={isLoading || hasApiKeyError}
                  className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim() || hasApiKeyError}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Requirements Tracker */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Requirements</h3>
              </div>
              <div className="space-y-2">
                {requirementsList.map((req) => (
                  <div key={req.key} className="flex items-center gap-2 text-xs">
                    {req.value ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className="text-muted-foreground">{req.label}:</span>
                    <span className={cn(
                      "font-mono truncate",
                      req.value ? 'text-foreground' : 'text-muted-foreground/50'
                    )}>
                      {req.value || (req.optional ? 'Optional' : 'Pending')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Provider Recommendation */}
          {(isSearching || recommendation) && (
            <Card className="bg-card/50 backdrop-blur border-primary/50">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">
                    {isSearching ? 'Searching...' : 'Best Match'}
                  </h3>
                </div>
                {isSearching ? (
                  <div className="py-8 flex justify-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                    </div>
                  </div>
                ) : recommendation && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-medium">{recommendation.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Price</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          ${recommendation.price.toFixed(4)}/hr
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className="font-mono">{recommendation.uptime.toFixed(1)}%</span>
                      </div>
                      {recommendation.region && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Region</span>
                          <span className="font-mono">{recommendation.region}</span>
                        </div>
                      )}
                    </div>
                    {recommendation.reason && (
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                        {recommendation.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
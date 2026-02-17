'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Server, Cpu, HardDrive, Activity } from 'lucide-react';

// Define deployment requirements
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Example deployment scenarios
  const exampleScenarios = [
    {
      title: 'Web Server',
      specs: 'I need nginx with 2 CPU, 4Gi RAM, 10Gi storage, port 80',
      icon: <Server className="h-4 w-4" />,
    },
    {
      title: 'AI Workload',
      specs: 'Deploy pytorch/pytorch with H100 GPU, 8 CPU, 32Gi RAM, 100Gi storage',
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      title: 'Database',
      specs: 'Run postgres:15 with 4 CPU, 8Gi RAM, 50Gi storage, port 5432',
      icon: <HardDrive className="h-4 w-4" />,
    },
    {
      title: 'Node.js App',
      specs: 'Deploy node:18-alpine with 1 CPU, 2Gi RAM, 5Gi storage, port 3000',
      icon: <Activity className="h-4 w-4" />,
    },
  ];

  const handleScenarioClick = (specs: string) => {
    setInput(specs);
  };

  // Check for API key configuration error
  const hasApiKeyError = error?.message?.includes('Gemini API key');

  // Extract requirements and recommendations from messages
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.role === 'assistant') {
        // Extract text content from message parts
        const textContent = msg.parts?.filter(part => part.type === 'text')
          .map(part => part.text)
          .join(' ') || '';

        // Check for tool outputs with requirement updates
        msg.parts?.forEach(part => {
          if (part.type === 'tool-result' && part.result) {
            const result = part.result as any;

            // Check for requirement updates from gatherRequirements tool
            if (result.requirementUpdate?.allRequirements) {
              setRequirements(result.requirementUpdate.allRequirements);

              // Check if all required fields are filled
              const { dockerImage, cpu, memory, storage } = result.requirementUpdate.allRequirements;
              if (dockerImage && cpu && memory && storage && result.readyToSearch) {
                setIsSearching(true);
              }
            }

            // Check for provider recommendations from searchProviders tool
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Akash Network Infrastructure Consultant</h1>
        <p className="text-muted-foreground">
          Get personalized provider recommendations for your container deployments on Akash Network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle>Infrastructure Assistant</CardTitle>
                </div>
              </div>
              <CardDescription>
                Describe your deployment needs and I'll find the perfect Akash provider for you
              </CardDescription>
            </CardHeader>

            <Separator className="flex-shrink-0" />

            <CardContent className="flex flex-col flex-1 min-h-0 p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {hasApiKeyError ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                    <p className="text-center text-muted-foreground mb-2">
                      Gemini API key not configured
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                      Please add <code className="bg-muted px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code> to your .env.local file
                    </p>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 text-primary hover:underline text-sm"
                    >
                      Get your API key from Google AI Studio →
                    </a>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-6">
                        Tell me about your deployment requirements and I'll find the best Akash provider for you
                      </p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium text-muted-foreground">Quick deployment scenarios:</p>
                      <div className="grid grid-cols-1 gap-3">
                        {exampleScenarios.map((scenario, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-4 px-4"
                            onClick={() => handleScenarioClick(scenario.specs)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className="mt-1 flex-shrink-0">{scenario.icon}</div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="font-semibold text-sm">{scenario.title}</div>
                                <div className="text-xs text-muted-foreground break-words whitespace-normal leading-relaxed">
                                  {scenario.specs}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[85%] ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.parts?.map((part, i) => {
                              if (part.type === 'text') {
                                return <span key={i}>{part.text}</span>;
                              }
                              return null;
                            })}
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your deployment: e.g., 'I need nginx with 2 CPU, 4Gi RAM, port 80'"
                    disabled={isLoading || hasApiKeyError}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim() || hasApiKeyError}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Requirements Tracker */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Deployment Requirements</CardTitle>
              <CardDescription className="text-xs">
                Your specifications for provider matching
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Docker Image:</span>
                  <span className={`font-mono text-xs ${requirements.dockerImage ? 'text-green-500' : ''}`}>
                    {requirements.dockerImage || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU:</span>
                  <span className={`font-mono text-xs ${requirements.cpu ? 'text-green-500' : ''}`}>
                    {requirements.cpu || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memory:</span>
                  <span className={`font-mono text-xs ${requirements.memory ? 'text-green-500' : ''}`}>
                    {requirements.memory || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage:</span>
                  <span className={`font-mono text-xs ${requirements.storage ? 'text-green-500' : ''}`}>
                    {requirements.storage || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GPU:</span>
                  <span className={`font-mono text-xs ${requirements.gpu ? 'text-green-500' : ''}`}>
                    {requirements.gpu || 'Not required'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Port:</span>
                  <span className={`font-mono text-xs ${requirements.port ? 'text-green-500' : ''}`}>
                    {requirements.port || 'Not specified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Recommendation Card */}
          {(isSearching || recommendation) && (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isSearching ? 'Searching Providers...' : 'Recommended Provider'}
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : recommendation ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-semibold text-xs">{recommendation.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-mono text-xs text-green-500">
                          ${recommendation.price.toFixed(4)}/hr
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="font-mono text-xs">{recommendation.uptime.toFixed(1)}%</span>
                      </div>
                      {recommendation.region && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Region:</span>
                          <span className="font-mono text-xs">{recommendation.region}</span>
                        </div>
                      )}
                    </div>
                    {recommendation.reason && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">How It Works</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Describe your deployment needs in natural language</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>I'll ask for any missing specifications</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>I'll search live Akash providers</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Get a recommendation with SDL manifest</span>
                </li>
              </ol>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
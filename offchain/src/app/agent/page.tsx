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
  dockerImage?: string;
  cpu?: number;
  memory?: string;
  storage?: string;
  gpu?: string;
  port?: number;
  region?: string;
}

export default function AgentPage() {
  const [requirements, setRequirements] = useState<DeploymentRequirements>({});
  const [quickSpecs, setQuickSpecs] = useState('');
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

  // Extract requirements from messages
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.role === 'assistant') {
        // Extract text content from message parts
        const textContent = msg.parts?.filter(part => part.type === 'text')
          .map(part => part.text)
          .join(' ') || '';

        if (textContent) {
          // Try to extract deployment specs mentioned in the conversation
          const cpuMatch = textContent.match(/(\d+(?:\.\d+)?)\s*CPU/i);
          const memMatch = textContent.match(/(\d+)\s*(Mi|Gi)\s*(?:RAM|memory)/i);
          const storageMatch = textContent.match(/(\d+)\s*(Mi|Gi)\s*storage/i);

          if (cpuMatch) setRequirements(prev => ({ ...prev, cpu: parseFloat(cpuMatch[1]) }));
          if (memMatch) setRequirements(prev => ({ ...prev, memory: `${memMatch[1]}${memMatch[2]}` }));
          if (storageMatch) setRequirements(prev => ({ ...prev, storage: `${storageMatch[1]}${storageMatch[2]}` }));
        }
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
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="pb-3">
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

            <Separator />

            <CardContent className="flex flex-col h-[calc(100%-8rem)] p-0">
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
              <div className="p-4 border-t">
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
                  <span className="font-mono text-xs">
                    {requirements.dockerImage || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU:</span>
                  <span className="font-mono text-xs">
                    {requirements.cpu ? `${requirements.cpu} units` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memory:</span>
                  <span className="font-mono text-xs">
                    {requirements.memory || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage:</span>
                  <span className="font-mono text-xs">
                    {requirements.storage || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GPU:</span>
                  <span className="font-mono text-xs">
                    {requirements.gpu || 'Not required'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Port:</span>
                  <span className="font-mono text-xs">
                    {requirements.port || 'Not specified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

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
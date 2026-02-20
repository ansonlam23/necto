'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RequirementsChecklist } from '@/components/agent/RequirementsChecklist';
import { ProviderCard } from '@/components/agent/ProviderCard';
import { Send, Bot, Sparkles, Server, Cpu, Gamepad2, Image, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeploymentConfig, ProviderMatch, DeploymentScenario } from '@/types/deployment';

export default function AgentPage() {
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({});
  const [providerMatch, setProviderMatch] = useState<ProviderMatch | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent-chat',
    }),
  });
  const [isLoading, setIsLoading] = useState(false);

  const scenarios: DeploymentScenario[] = [
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
      id: 'ai-training',
      title: 'AI Model Training',
      description: 'Train or fine-tune LLMs',
      prompt: 'I need to fine-tune Llama 3 on my dataset',
      icon: 'cpu',
      color: 'text-purple-500',
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

  const handleScenarioClick = (scenario: DeploymentScenario) => {
    if (scenario.prompt) {
      setInput(scenario.prompt);
    }
  };

  // Extract config and provider from tool calls
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.role === 'assistant') {
        msg.parts?.forEach(part => {
          if (part.type === 'tool-result' && 'result' in part && part.result) {
            const result = part.result as { config?: DeploymentConfig; readyToSearch?: boolean; bestProvider?: ProviderMatch };

            // Handle proposeDeployment tool results
            if (result.config && result.readyToSearch) {
              setDeploymentConfig(result.config);
              setIsSearching(true);
            }

            // Handle searchAkash tool results
            if (result.bestProvider) {
              setProviderMatch({
                id: result.bestProvider.id,
                name: result.bestProvider.name,
                price: result.bestProvider.price,
                uptime: result.bestProvider.uptime,
                hardware: result.bestProvider.hardware,
                region: result.bestProvider.region,
                reason: result.bestProvider.reason,
              });
              setIsSearching(false);
            }
          }
        });
      }
    });
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Left Sidebar - Requirements & Provider */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <RequirementsChecklist config={deploymentConfig} />
          <ProviderCard
            provider={providerMatch}
            isSearching={isSearching}
          />
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col bg-card/30 backdrop-blur border-border/50">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
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

                  {/* Quick Start Scenarios */}
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
                            : 'bg-muted/30 border border-border/50'
                        )}
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
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
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
                  placeholder="Describe what you want to deploy..."
                  disabled={isLoading}
                  className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
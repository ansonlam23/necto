'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequirementsChecklist } from '@/components/agent/RequirementsChecklist';
import { Send, Bot, Sparkles, Server, Cpu, Gamepad2, Image, Database, CheckCircle2, Loader2, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeploymentConfig, DeploymentScenario } from '@/types/deployment';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

const RESPONSES: Array<{
  config: DeploymentConfig;
  text: string;
  thinkingSteps: Array<{ id: string; label: string }>;
}> = [
  {
    config: {
      dockerImage: 'pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime',
      cpu: 4,
      memory: 16,
      memoryUnit: 'Gi',
      storage: 100,
      storageUnit: 'Gi',
      gpu: 'NVIDIA A100',
      gpuCount: 1,
      port: 8888,
      region: 'us-east',
      token: 'AKT',
    },
    thinkingSteps: [
      { id: 'parse', label: 'Parsing workload requirements...' },
      { id: 'gpu', label: 'Identifying optimal GPU configuration...' },
      { id: 'akash', label: 'Checking provider availability...' },
      { id: 'spec', label: 'Generating deployment specification...' },
    ],
    text: `Based on your PyTorch GPU training workload, I've analyzed the requirements and configured an optimal deployment spec:

Deployment Configuration:
  Docker Image:  pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime
  CPU:           4 vCPU
  Memory:        16 Gi
  Storage:       100 Gi
  GPU:           NVIDIA A100 x1
  Port:          8888 (Jupyter)
  Region:        us-east

Why this configuration?
The NVIDIA A100 is purpose-built for ML training — 80 GB HBM2e memory, 3rd-gen Tensor Cores for mixed-precision training, and native CUDA 11.8 support. 16 Gi RAM handles large dataset preprocessing pipelines without swapping. 100 Gi storage gives you headroom for training data, model checkpoints, and experiment artifacts.

Would you like me to find the best available provider for this configuration?`,
  },
  {
    config: {
      dockerImage: 'pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime',
      cpu: 2,
      memory: 16,
      memoryUnit: 'Gi',
      storage: 40,
      storageUnit: 'Gi',
      gpu: 'NVIDIA A100',
      gpuCount: 1,
      port: 8888,
      region: 'us-east',
      token: 'AKT',
    },
    thinkingSteps: [
      { id: 'adjust', label: 'Applying resource adjustments...' },
      { id: 'validate', label: 'Validating updated configuration...' },
      { id: 'reprice', label: 'Re-evaluating provider pricing...' },
      { id: 'confirm', label: 'Confirming spec changes...' },
    ],
    text: `Got it — trimming CPU and storage. Here's the updated configuration:

Deployment Configuration:
  Docker Image:  pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime
  CPU:           2 vCPU  (was 4)
  Memory:        16 Gi   (unchanged)
  Storage:       40 Gi   (was 100)
  GPU:           NVIDIA A100 x1
  Port:          8888 (Jupyter)
  Region:        us-east

What changed and why:
  CPU 4 → 2 vCPU  — GPU training is compute-bound on CUDA, not CPU. 2 vCPU is enough to feed the data loader and handle preprocessing without bottlenecking.
  Storage 100 → 40 Gi  — Sufficient for a mid-size dataset and checkpoint saves. You can always attach persistent storage later if experiments grow.
  Memory unchanged  — 16 Gi keeps your data pipeline in RAM; going lower risks swapping during batch loading.

This config will save you roughly 30-40% on hourly cost vs the original.`,
  },
  {
    config: {
      dockerImage: 'pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime',
      cpu: 2,
      memory: 16,
      memoryUnit: 'Gi',
      storage: 40,
      storageUnit: 'Gi',
      gpu: 'NVIDIA A100',
      gpuCount: 1,
      port: 8888,
      region: 'us-east',
      token: 'AKT',
    },
    thinkingSteps: [
      { id: 'query', label: 'Querying decentralized provider network...' },
      { id: 'score', label: 'Scoring 8 qualified candidates...' },
      { id: 'verify', label: 'Verifying hardware specs...' },
      { id: 'bid', label: 'Selecting lowest bid...' },
    ],
    text: `Found the best match on the Akash Network:

  Provider:   akash1ccktptfkvkamvsauguyy6ygqwqnwzkfep3y2l3
  Alias:      Equinix SV15 — Akash Node
  Price:      $0.8340/hr  (bid won at 0.34 uakt/block)
  Uptime:     99.8%  (90-day avg)
  Region:     us-east  (San Jose, CA)
  Match:      97%

Hardware confirmed: NVIDIA A100 SXM4 80GB / 2 vCPU / 16 GB RAM / 40 GB NVMe

Lowest bid among 8 active providers. Equinix SV15 has full PCIe Gen4 bandwidth to the GPU and bare-metal isolation — no noisy neighbours. On-chain lease will be opened once you confirm.

Ready to deploy — confirm to submit the job.`,
  },
];

export default function AgentPage() {
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [responseIndex, setResponseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const response = RESPONSES[Math.min(responseIndex, RESPONSES.length - 1)];
    const steps = response.thinkingSteps;

    setThinkingSteps(steps.map(s => ({ ...s, status: 'pending' as const })));

    // Progress through each thinking step
    const stepDurations = [500, 750, 750, 650];
    for (let i = 0; i < steps.length; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, i === 0 ? 300 : stepDurations[i]));
      setThinkingSteps(prev =>
        prev.map((s, idx) => ({
          ...s,
          status: idx === i ? 'active' : idx < i ? 'complete' : 'pending',
        }))
      );
      await new Promise<void>(resolve => setTimeout(resolve, stepDurations[i]));
      setThinkingSteps(prev =>
        prev.map((s, idx) => ({
          ...s,
          status: idx <= i ? 'complete' : 'pending',
        }))
      );
    }

    await new Promise<void>(resolve => setTimeout(resolve, 350));
    setIsThinking(false);
    setThinkingSteps([]);

    setMessages(prev => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
      },
    ]);

    setDeploymentConfig(response.config);
    setResponseIndex(prev => prev + 1);
  };

  const handleScenarioClick = (scenario: DeploymentScenario) => {
    if (scenario.prompt) {
      setInput(scenario.prompt);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

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
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)] flex gap-6">

      {/* Left Sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 space-y-4 overflow-y-auto">
        <RequirementsChecklist config={deploymentConfig} />
        <Button
          disabled={responseIndex < 3}
          className={cn(
            "w-full gap-2 transition-all duration-300",
            responseIndex >= 3
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
          {messages.length === 0 && !isThinking ? (
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
              {messages.map((message) => (
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
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Thinking / processing bubble */}
              {isThinking && (
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

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input — always pinned to bottom */}
        <div className="shrink-0 p-4 border-t border-border/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you want to deploy..."
              disabled={isThinking}
              className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
            />
            <Button
              type="submit"
              disabled={isThinking || !input.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  parseNaturalLanguage,
  JobRequirements
} from '@/lib/akash/sdl-generator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Cpu, MemoryStick, HardDrive, Zap, Box } from 'lucide-react';

interface NaturalLanguageInputProps {
  className?: string;
  onParsed?: (requirements: Partial<JobRequirements>) => void;
  initialValue?: string;
}

const EXAMPLE_SUGGESTIONS = [
  {
    label: 'PyTorch Training',
    text: 'I need to run a PyTorch training job with GPU for my deep learning model'
  },
  {
    label: 'Jupyter Notebook',
    text: 'I want a Jupyter notebook environment for data analysis with 8GB memory'
  },
  {
    label: 'Stable Diffusion',
    text: 'I need Stable Diffusion with GPU to generate AI images'
  },
  {
    label: 'Ollama LLM',
    text: 'I want to run Ollama to host local LLMs with 32GB memory and GPU'
  },
  {
    label: 'NGINX Server',
    text: 'I need a simple NGINX web server to host a static site'
  }
];

function RequirementPreview({
  requirements,
  className
}: {
  requirements: Partial<JobRequirements>;
  className?: string;
}) {
  if (Object.keys(requirements).length === 0) {
    return null;
  }

  return (
    <Card className={cn("bg-muted/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Detected Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {requirements.image && (
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Image</p>
                <p className="text-sm font-mono truncate max-w-48">{requirements.image}</p>
              </div>
            </div>
          )}
          {requirements.cpu && (
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">CPU</p>
                <p className="text-sm">{requirements.cpu} cores</p>
              </div>
            </div>
          )}
          {requirements.memory && (
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Memory</p>
                <p className="text-sm">{requirements.memory}</p>
              </div>
            </div>
          )}
          {requirements.storage && (
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="text-sm">{requirements.storage}</p>
              </div>
            </div>
          )}
          {requirements.gpu && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">GPU</p>
                <p className="text-sm text-amber-500">
                  {requirements.gpu.units}x {requirements.gpu.model || 'GPU'}
                </p>
              </div>
            </div>
          )}
          {requirements.name && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{requirements.name}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionButtons({
  onSelect,
  className
}: {
  onSelect: (text: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted-foreground">Try an example:</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion.label}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion.text)}
            className="text-xs"
          >
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function NaturalLanguageInput({
  className,
  onParsed,
  initialValue = ''
}: NaturalLanguageInputProps) {
  const [value, setValue] = React.useState(initialValue);
  const [parsedRequirements, setParsedRequirements] = React.useState<Partial<JobRequirements>>({});
  const [isParsing, setIsParsing] = React.useState(false);

  const handleParse = React.useCallback(() => {
    if (!value.trim()) return;

    setIsParsing(true);

    // Simulate async parsing for UX feedback
    setTimeout(() => {
      const requirements = parseNaturalLanguage(value);
      setParsedRequirements(requirements);
      onParsed?.(requirements);
      setIsParsing(false);
    }, 300);
  }, [value, onParsed]);

  const handleSuggestionSelect = (text: string) => {
    setValue(text);
    // Auto-parse when suggestion selected
    setTimeout(() => {
      const requirements = parseNaturalLanguage(text);
      setParsedRequirements(requirements);
      onParsed?.(requirements);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleParse();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Textarea
          placeholder="Describe your compute job in natural language... (e.g., 'I need a PyTorch environment with GPU for training')"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press ⌘+Enter to parse
          </p>
          <Button
            onClick={handleParse}
            disabled={!value.trim() || isParsing}
            size="sm"
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Parse Requirements
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {!value && (
        <SuggestionButtons onSelect={handleSuggestionSelect} />
      )}

      {/* Parsed Result */}
      {Object.keys(parsedRequirements).length > 0 && (
        <RequirementPreview requirements={parsedRequirements} />
      )}
    </div>
  );
}

export { RequirementPreview, SuggestionButtons };

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { SdlSpec } from '@/types/akash';
import {
  generateSDL,
  validateSDL,
  sdlToYAML,
  JobRequirements
} from '@/lib/akash/sdl-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Copy,
  Download,
  Check,
  AlertCircle,
  FileCode,
  Edit3
} from 'lucide-react';

interface SdlEditorProps {
  className?: string;
  sdl?: SdlSpec;
  requirements?: Partial<JobRequirements>;
  onChange?: (sdl: SdlSpec, yaml: string) => void;
  readOnly?: boolean;
}

export function SdlEditor({
  className,
  sdl: initialSdl,
  requirements,
  readOnly = false
}: SdlEditorProps) {
  const [yaml, setYaml] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isModified, setIsModified] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Generate YAML from SDL or requirements
  React.useEffect(() => {
    if (initialSdl) {
      const yamlStr = sdlToYAML(initialSdl);
      setYaml(yamlStr);
      const result = validateSDL(initialSdl);
      setIsValid(result.valid);
      setValidationErrors(result.errors);
    } else if (requirements && requirements.name && requirements.image) {
      const sdl = generateSDL(requirements as JobRequirements);
      const yamlStr = sdlToYAML(sdl);
      setYaml(yamlStr);
      const result = validateSDL(sdl);
      setIsValid(result.valid);
      setValidationErrors(result.errors);
    }
  }, [initialSdl, requirements]);

  const handleYamlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setYaml(e.target.value);
    setIsModified(true);
    // Note: Full YAML parsing would require js-yaml library
    // For now, we just track modifications
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deployment.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            SDL Configuration
          </CardTitle>
          <div className="flex items-center gap-2">
            {isModified && (
              <Badge variant="outline" className="gap-1">
                <Edit3 className="h-3 w-3" />
                Modified
              </Badge>
            )}
            {isValid ? (
              <Badge variant="default" className="gap-1 bg-green-600">
                <Check className="h-3 w-3" />
                Valid
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Invalid
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Textarea
            value={yaml}
            onChange={handleYamlChange}
            readOnly={readOnly}
            className={cn(
              "font-mono text-sm min-h-80",
              readOnly && "bg-muted cursor-not-allowed"
            )}
            placeholder="# SDL configuration will appear here..."
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!yaml}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!yaml}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// YAML-only editor for raw editing
export function YamlEditor({
  className,
  value,
  onChange,
  readOnly = false
}: {
  className?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      className={cn(
        "font-mono text-sm min-h-80",
        readOnly && "bg-muted cursor-not-allowed",
        className
      )}
      placeholder="# Enter YAML configuration..."
    />
  );
}

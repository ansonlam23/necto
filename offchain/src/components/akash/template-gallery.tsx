'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { SdlTemplate, getTemplates, searchTemplates } from '@/lib/akash/sdl-generator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Search,
  Sparkles,
  Globe,
  Database,
  Zap
} from 'lucide-react';

interface TemplateGalleryProps {
  className?: string;
  onSelect?: (template: SdlTemplate) => void;
  selectedId?: string;
}

const CATEGORY_ICONS: Record<SdlTemplate['category'], React.ReactNode> = {
  ai: <Sparkles className="h-4 w-4" />,
  compute: <Cpu className="h-4 w-4" />,
  storage: <Database className="h-4 w-4" />,
  web: <Globe className="h-4 w-4" />
};

const CATEGORY_LABELS: Record<SdlTemplate['category'], string> = {
  ai: 'AI & ML',
  compute: 'Compute',
  storage: 'Storage',
  web: 'Web Services'
};

const POPULAR_TEMPLATE_IDS = ['pytorch-gpu', 'jupyter-notebook', 'nginx-web', 'ollama'];

function TemplateCard({
  template,
  isSelected,
  onSelect,
  isPopular
}: {
  template: SdlTemplate;
  isSelected: boolean;
  onSelect: () => void;
  isPopular?: boolean;
}) {
  const requirements = template.requirements;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        isSelected && "border-primary ring-1 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              {CATEGORY_ICONS[template.category]}
              {template.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {isPopular && (
            <Badge variant="secondary" className="ml-2 shrink-0">
              <Zap className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              <span>{requirements.cpu || 1} CPU</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MemoryStick className="h-3.5 w-3.5" />
              <span>{requirements.memory || '1Gi'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              <span>{requirements.storage || '10Gi'}</span>
            </div>
            {requirements.gpu && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-500">GPU x{requirements.gpu.units}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateQuickSelect({
  templates,
  selectedId,
  onSelect
}: {
  templates: SdlTemplate[];
  selectedId?: string;
  onSelect: (template: SdlTemplate) => void;
}) {
  const popularTemplates = templates.filter((t) =>
    POPULAR_TEMPLATE_IDS.includes(t.id)
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Quick Select</h3>
      <div className="flex flex-wrap gap-2">
        {popularTemplates.map((template) => (
          <Button
            key={template.id}
            variant={selectedId === template.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(template)}
            className="gap-1.5"
          >
            {CATEGORY_ICONS[template.category]}
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function TemplateGallery({
  className,
  onSelect,
  selectedId
}: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<SdlTemplate['category'] | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = React.useState<SdlTemplate | null>(null);

  const allTemplates = React.useMemo(() => getTemplates(), []);

  const filteredTemplates = React.useMemo(() => {
    let templates = allTemplates;

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    if (selectedCategory !== 'all') {
      templates = templates.filter((t) => t.category === selectedCategory);
    }

    return templates;
  }, [allTemplates, searchQuery, selectedCategory]);

  const handleSelect = (template: SdlTemplate) => {
    setSelectedTemplate(template);
    onSelect?.(template);
  };

  const categories: (SdlTemplate['category'] | 'all')[] = ['all', 'ai', 'compute', 'storage', 'web'];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Select */}
      <TemplateQuickSelect
        templates={allTemplates}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}
      >
        <TabsList className="w-full justify-start">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="gap-1.5">
              {cat !== 'all' && CATEGORY_ICONS[cat]}
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={
                    selectedTemplate?.id === template.id ||
                    selectedId === template.id
                  }
                  onSelect={() => handleSelect(template)}
                  isPopular={POPULAR_TEMPLATE_IDS.includes(template.id)}
                />
              ))}
              {filteredTemplates.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No templates found matching your search
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Selected Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedTemplate.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(null)}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { TemplateCard };

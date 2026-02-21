'use client';

import { FileText, ExternalLink, Server, ArrowRightLeft, Globe, Trash2 } from 'lucide-react';
import { useAuditStore } from '@/lib/audit-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AuditLogPage() {
  const { entries, clearEntries } = useAuditStore();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        </div>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" onClick={clearEntries}>
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No entries yet</h2>
          <p className="text-muted-foreground">
            Completed deployments will appear here with Akash and ADI Explorer links.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    Akash Deployment
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30">
                      Active
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.deploymentId && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Deployment ID</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono truncate">
                        {entry.deploymentId}
                      </code>
                      {entry.akashUrl && (
                        <a href={entry.akashUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                            <ExternalLink className="h-3 w-3" /> Akash Console
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {entry.serviceUris.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Service URLs
                    </p>
                    {entry.serviceUris.map((uri, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono truncate">{uri}</code>
                        <a href={uri.startsWith('http') ? uri : `http://${uri}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {entry.transferTxHash && (
                    <TxRow
                      label="USDC Transfer"
                      hash={entry.transferTxHash}
                      explorerUrl={entry.explorerBaseUrl}
                    />
                  )}
                  {entry.submitJobTxHash && (
                    <TxRow
                      label="Escrow Job"
                      hash={entry.submitJobTxHash}
                      explorerUrl={entry.explorerBaseUrl}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TxRow({ label, hash, explorerUrl }: { label: string; hash: string; explorerUrl: string }) {
  return (
    <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
      <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <code className="text-xs font-mono truncate block">
          {hash.slice(0, 10)}...{hash.slice(-8)}
        </code>
      </div>
      <a href={`${explorerUrl}/tx/${hash}`} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
          <ExternalLink className="h-3 w-3" />
        </Button>
      </a>
    </div>
  );
}

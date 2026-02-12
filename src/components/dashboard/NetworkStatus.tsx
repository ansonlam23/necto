"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const networks = [
  { name: "Render Network", status: "Active", utilization: 94.2, nodes: 1247 },
  { name: "Akash Network", status: "Active", utilization: 87.8, nodes: 892 },
  { name: "Flux", status: "Active", utilization: 76.3, nodes: 634 },
  { name: "Golem", status: "Maintenance", utilization: 45.1, nodes: 234 },
  { name: "iExec", status: "Active", utilization: 91.7, nodes: 456 },
]

export function NetworkStatus() {
  return (
    <Card className="border-sidebar-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Network Status</span>
          <Badge variant="outline" className="terminal-data">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {networks.map((network) => (
            <div key={network.name} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {network.name}
                </p>
                <p className="text-xs text-muted-foreground terminal-data">
                  {network.nodes} nodes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium terminal-data">
                    {network.utilization}%
                  </p>
                  <Badge
                    variant={network.status === "Active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {network.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
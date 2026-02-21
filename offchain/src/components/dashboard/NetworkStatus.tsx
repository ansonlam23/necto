"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const networks = [
  { name: "io.net",      status: "Active", utilization: 91.4, nodes: 1_840, price: "$1.82/hr" },
  { name: "Akash",       status: "Active", utilization: 88.2, nodes: 1_203, price: "$0.84/hr" },
  { name: "Render",      status: "Active", utilization: 94.6, nodes:   987, price: "$0.74/hr" },
  { name: "Spheron",     status: "Active", utilization: 79.1, nodes:   612, price: "$0.38/hr" },
  { name: "Aethir",      status: "Active", utilization: 83.7, nodes:   541, price: "$0.55/hr" },
  { name: "Nosana",      status: "Active", utilization: 72.4, nodes:   389, price: "$0.21/hr" },
  { name: "Hyperspace",  status: "Active", utilization: 68.9, nodes:   298, price: "$0.19/hr" },
  { name: "Gensyn",      status: "Active", utilization: 61.2, nodes:   142, price: "$0.31/hr" },
]

export function NetworkStatus() {
  return (
    <Card className="border-sidebar-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          Network Status
          <Badge variant="outline" className="terminal-data text-green-500 border-green-500/30 text-[10px]">
            ● Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {networks.map((network) => (
            <div key={network.name} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <p className="text-sm font-medium w-24 shrink-0">{network.name}</p>
              <div className="flex-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${network.utilization}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground terminal-data w-10 text-right shrink-0">
                {network.utilization}%
              </span>
              <span className="text-xs text-green-500 terminal-data w-14 text-right shrink-0">
                {network.price}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

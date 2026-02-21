'use client'

import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { NetworkStatus } from "@/components/dashboard/NetworkStatus"
import { useAuditStore } from "@/lib/audit-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gpu, ExternalLink, Zap, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const TOP_GPUS = [
  { model: "NVIDIA H100 SXM5",   count: 89,  price: "$2.14/hr", network: "io.net",     trend: "+0.12" },
  { model: "NVIDIA A100 80GB",   count: 234, price: "$0.89/hr", network: "Akash",      trend: "-0.04" },
  { model: "NVIDIA A6000",       count: 156, price: "$0.45/hr", network: "Akash",      trend: "0.00"  },
  { model: "NVIDIA A10G",        count: 412, price: "$0.32/hr", network: "Render",     trend: "-0.02" },
  { model: "NVIDIA RTX 4090",    count: 678, price: "$0.28/hr", network: "Spheron",    trend: "+0.01" },
  { model: "NVIDIA L4",          count: 301, price: "$0.19/hr", network: "Hyperspace", trend: "-0.01" },
]

const RECENT_ACTIVITY = [
  { label: "Deployment active",      detail: "Akash · A100 80GB · $0.89/hr",        time: "2m ago",  type: "deploy" },
  { label: "New provider joined",    detail: "io.net · H100 ×4 · 99.2% uptime",     time: "14m ago", type: "provider" },
  { label: "Price dropped",          detail: "Render · A10G × 2 · was $0.34/hr",    time: "31m ago", type: "price" },
  { label: "Workflow executed",      detail: "Budget Guard triggered · saved $1.20", time: "1h ago",  type: "workflow" },
  { label: "Escrow settled",         detail: "12 USDC · Job #0x3f2a · Akash",        time: "2h ago",  type: "settle" },
]

export default function DashboardPage() {
  const { entries } = useAuditStore()

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">GPU compute marketplace · live data</p>
        </div>
        <div className="text-xs text-muted-foreground terminal-data bg-muted/30 px-2.5 py-1 rounded border border-border/50">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Stat cards */}
      <DashboardStats />

      {/* GPU Leaderboard + Network Status */}
      <div className="grid gap-4 md:grid-cols-7">

        {/* GPU Model Leaderboard */}
        <div className="col-span-4">
          <Card className="border-sidebar-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gpu className="h-4 w-4 text-purple-500" />
                Top GPU Models
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Model</th>
                    <th className="text-right px-4 py-2 font-medium">Available</th>
                    <th className="text-right px-4 py-2 font-medium">Avg Price</th>
                    <th className="text-right px-4 py-2 font-medium">Network</th>
                    <th className="text-right px-4 py-2 font-medium">24h Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_GPUS.map((gpu) => {
                    const trendVal = parseFloat(gpu.trend)
                    const trendColor = trendVal > 0 ? "text-red-400" : trendVal < 0 ? "text-green-400" : "text-muted-foreground"
                    return (
                      <tr key={gpu.model} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium terminal-data text-xs">{gpu.model}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{gpu.count}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-semibold text-green-500 terminal-data">{gpu.price}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge variant="outline" className="text-[10px] px-1.5">{gpu.network}</Badge>
                        </td>
                        <td className={`px-4 py-2.5 text-right text-xs terminal-data ${trendColor}`}>{gpu.trend}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-border/30">
                <Link href="/providers">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7">
                    View all providers <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Status */}
        <div className="col-span-3">
          <NetworkStatus />
        </div>
      </div>

      {/* Recent Activity + My Deployments */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Recent Activity */}
        <Card className="border-sidebar-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className={`mt-0.5 p-1 rounded shrink-0 ${
                  item.type === 'deploy'   ? 'bg-blue-500/10 text-blue-500' :
                  item.type === 'provider' ? 'bg-purple-500/10 text-purple-500' :
                  item.type === 'price'    ? 'bg-green-500/10 text-green-500' :
                  item.type === 'workflow' ? 'bg-orange-500/10 text-orange-500' :
                  'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {item.type === 'deploy'   && <ArrowUpRight className="h-3 w-3" />}
                  {item.type === 'provider' && <ArrowDownLeft className="h-3 w-3" />}
                  {item.type === 'price'    && <ArrowDownLeft className="h-3 w-3" />}
                  {item.type === 'workflow' && <Zap className="h-3 w-3" />}
                  {item.type === 'settle'   && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                  <Clock className="h-2.5 w-2.5" />
                  {item.time}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Deployments (from audit store) */}
        <Card className="border-sidebar-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                My Deployments
              </span>
              <Link href="/audit">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7">
                  View all <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No deployments yet</p>
                <p className="text-xs mt-1">Deploy a workload via the Agent to see it here</p>
                <Link href="/agent" className="mt-3 inline-block">
                  <Button size="sm" variant="outline" className="mt-3 text-xs">
                    Go to Agent
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 p-1 rounded shrink-0 bg-blue-500/10 text-blue-500">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">Akash Deployment</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 text-green-500 border-green-500/30">Active</Badge>
                      </div>
                      {entry.deploymentId && (
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {entry.deploymentId.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.akashUrl && (
                        <a href={entry.akashUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

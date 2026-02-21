"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, TrendingDown, BarChart3, Layers } from "lucide-react"

const stats = [
  {
    title: "Total GPU Nodes",
    value: "143",
    change: "+2.1%",
    changeType: "increase" as const,
    sub: "across 8 networks",
    icon: Server,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Avg GPU Price",
    value: "$0.42/hr",
    change: "-3.2%",
    changeType: "decrease" as const,
    sub: "cheaper than last week",
    icon: TrendingDown,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "24h Volume",
    value: "$38,492",
    change: "+11.7%",
    changeType: "increase" as const,
    sub: "in compute spend",
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Networks Online",
    value: "0 / 0",
    change: "—",
    changeType: "increase" as const,
    sub: "no active networks",
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-sidebar-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-1.5 rounded-md ${stat.bg}`}>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-data">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className={stat.changeType === "increase" ? "text-green-500" : "text-green-500"}>
                {stat.change}
              </span>{" "}
              {stat.sub}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

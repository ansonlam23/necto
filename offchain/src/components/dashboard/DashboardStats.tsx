"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, DollarSign, Cpu } from "lucide-react"

const stats = [
  {
    title: "Active Compute Units",
    value: "2,847",
    change: "+12.5%",
    changeType: "increase" as const,
    icon: Cpu,
  },
  {
    title: "Total Value Locked",
    value: "$1,247,892",
    change: "+8.2%",
    changeType: "increase" as const,
    icon: DollarSign,
  },
  {
    title: "Network Utilization",
    value: "87.3%",
    change: "-2.1%",
    changeType: "decrease" as const,
    icon: TrendingUp,
  },
  {
    title: "Active Networks",
    value: "23",
    change: "+3",
    changeType: "increase" as const,
    icon: Activity,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={stat.title} className="border-sidebar-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-data">{stat.value}</div>
            <p className={`text-xs ${
              stat.changeType === "increase"
                ? "text-green-500"
                : "text-red-500"
            }`}>
              {stat.change} from last period
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
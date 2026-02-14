"use client"

import * as React from "react"
import { Activity, WifiOff, Wifi, AlertCircle } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { WalletConnect } from "@/components/wallet-connect"

// Mock agent status - would come from real state in production
type AgentStatus = "connected" | "disconnected" | "error"

interface StatusIndicatorProps {
  status: AgentStatus
  label: string
}

function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case "connected":
        return "text-green-500"
      case "disconnected":
        return "text-muted-foreground"
      case "error":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: AgentStatus) => {
    if (label.includes("Agent")) {
      switch (status) {
        case "connected":
          return <Activity className="h-4 w-4" />
        case "error":
          return <AlertCircle className="h-4 w-4" />
        default:
          return <Activity className="h-4 w-4" />
      }
    } else {
      switch (status) {
        case "connected":
          return <Wifi className="h-4 w-4" />
        case "disconnected":
          return <WifiOff className="h-4 w-4" />
        default:
          return <WifiOff className="h-4 w-4" />
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex items-center", getStatusColor(status))}>
        {getStatusIcon(status)}
      </div>
      <span className="text-sm font-medium hidden sm:inline-block">
        {label}
      </span>
      <div className={cn(
        "h-2 w-2 rounded-full",
        status === "connected" && "bg-green-500 animate-pulse",
        status === "disconnected" && "bg-muted-foreground/50",
        status === "error" && "bg-red-500 animate-pulse"
      )} />
    </div>
  )
}

export function AppHeader() {
  // Mock state - would be managed by proper state management in production
  const [agentStatus] = React.useState<AgentStatus>("connected")

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Page context - could be dynamic based on route */}
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium text-sidebar-foreground">
            Institutional DePIN Terminal
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 px-4">
        {/* Agent Status */}
        <StatusIndicator status={agentStatus} label="Agent Status" />

        <Separator orientation="vertical" className="h-4" />

        {/* Wallet Connection */}
        <WalletConnect />
      </div>
    </header>
  )
}
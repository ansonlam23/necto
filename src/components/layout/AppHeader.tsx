"use client"

import * as React from "react"
import { Activity, Wallet, WifiOff, Wifi, AlertCircle } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Mock agent status - would come from real state in production
type AgentStatus = "connected" | "disconnected" | "error"
type WalletStatus = "connected" | "disconnected"

interface StatusIndicatorProps {
  status: AgentStatus | WalletStatus
  label: string
}

function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const getStatusColor = (status: AgentStatus | WalletStatus) => {
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

  const getStatusIcon = (status: AgentStatus | WalletStatus) => {
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
  // Mock states - would be managed by proper state management in production
  const [agentStatus] = React.useState<AgentStatus>("connected")
  const [walletStatus] = React.useState<WalletStatus>("disconnected")
  const [walletAddress] = React.useState<string | null>(null)

  const handleWalletConnect = () => {
    // Mock wallet connection logic
    console.log("Wallet connect clicked")
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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
        {walletStatus === "connected" && walletAddress ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Wallet className="mr-2 h-4 w-4" />
                <span className="terminal-data">
                  {truncateAddress(walletAddress)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Connected Wallet</span>
                  <span className="text-xs text-muted-foreground terminal-data">
                    {walletAddress}
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Copy Address</DropdownMenuItem>
              <DropdownMenuItem>View on Explorer</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Disconnect Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={handleWalletConnect} size="sm" className="h-8">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  )
}
import { Home } from "lucide-react"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { NetworkStatus } from "@/components/dashboard/NetworkStatus"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="text-sm text-muted-foreground terminal-data">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <DashboardStats />

      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4">
          <div className="rounded-lg border bg-card p-6 border-sidebar-border/50">
            <h2 className="text-lg font-semibold mb-4">Compute Utilization</h2>
            <div className="grid-lines rounded-md p-4 min-h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Real-time network utilization chart will be displayed here
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <NetworkStatus />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 border-sidebar-border/50">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {[
              { id: "TX001", amount: "$12,847", network: "Render", status: "Complete" },
              { id: "TX002", amount: "$8,923", network: "Akash", status: "Pending" },
              { id: "TX003", amount: "$15,672", network: "Flux", status: "Complete" },
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-md bg-sidebar/20">
                <div>
                  <p className="text-sm font-medium terminal-data">{tx.id}</p>
                  <p className="text-xs text-muted-foreground">{tx.network}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium terminal-data">{tx.amount}</p>
                  <p className="text-xs text-muted-foreground">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 border-sidebar-border/50">
          <h2 className="text-lg font-semibold mb-4">Alert Center</h2>
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-blue-600/10 border border-blue-600/20">
              <p className="text-sm text-blue-400">Network maintenance scheduled for Golem</p>
              <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
            </div>
            <div className="p-3 rounded-md bg-green-600/10 border border-green-600/20">
              <p className="text-sm text-green-400">Render Network utilization optimal</p>
              <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

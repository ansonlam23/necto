import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">System Configuration</h2>
        <p className="text-muted-foreground">
          Configure institutional settings, network preferences, compliance parameters,
          and terminal interface customizations.
        </p>
      </div>
    </div>
  )
}
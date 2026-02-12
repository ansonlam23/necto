import { Boxes } from "lucide-react"

export default function WorkflowBuilderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Boxes className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Workflow Builder</h1>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <Boxes className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Build DePIN Workflows</h2>
        <p className="text-muted-foreground">
          Design and deploy compute procurement workflows across decentralized networks.
          This interface will provide drag-and-drop workflow building capabilities.
        </p>
      </div>
    </div>
  )
}
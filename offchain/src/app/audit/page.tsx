import { FileText } from "lucide-react"

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Transaction History</h2>
        <p className="text-muted-foreground">
          Complete audit trail of all DePIN network interactions, compute procurement,
          and institutional transactions with compliance reporting.
        </p>
      </div>
    </div>
  )
}
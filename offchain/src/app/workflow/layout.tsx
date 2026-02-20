export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="absolute inset-0 top-16 overflow-hidden">
      {children}
    </div>
  )
}
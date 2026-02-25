export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen flex-col">
        {/* Placeholder: will add Sidebar and Topbar here */}
        <header className="border-b border-border bg-card p-4">
          <h1 className="text-2xl font-bold">DeporteIA</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

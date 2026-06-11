import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TemplateEditor } from "@/components/TemplateEditor";
import { useCustomers } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Publisher — HTML snippets for any CMS" },
      {
        name: "description",
        content:
          "Pick a customer, preview a saved template, sandbox quick edits, and copy clean HTML into your CMS.",
      },
      { property: "og:title", content: "Publisher — HTML snippets for any CMS" },
      {
        property: "og:description",
        content:
          "Publishing dashboard for browsing locked templates and sandboxing one-off tweaks.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { customers, updateCustomer } = useCustomers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && customers.length) {
      setSelectedId(customers[0].id);
    }
    if (selectedId && !customers.find((c) => c.id === selectedId)) {
      setSelectedId(customers[0]?.id ?? null);
    }
  }, [customers, selectedId]);

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar
          customers={customers}
          selectedId={selectedId}
          onSelect={(id, templateId) => {
            setSelectedId(id);
            if (templateId) setPendingTemplateId(templateId);
          }}
          onUpdateNotes={(id, notes) => updateCustomer(id, { notes })}
        />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border bg-card/40 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex flex-col leading-tight">
              <h1 className="text-sm font-semibold">Publisher dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Browse templates, sandbox tweaks, copy HTML into any CMS.
              </p>
            </div>
            <Link
              to="/admin"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
            >
              <Settings className="h-3.5 w-3.5" /> Admin
            </Link>
          </header>
          <main className="flex-1 overflow-hidden">
            {selected ? (
              <TemplateEditor
                key={selected.id}
                customer={selected}
                initialTemplateId={pendingTemplateId}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No customers yet — head to Admin to add one.
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

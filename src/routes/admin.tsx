import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TemplateEditor } from "@/components/TemplateEditor";
import { useCustomers } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Customers & templates" },
      {
        name: "description",
        content:
          "Administrative workspace for creating customers and authoring HTML templates.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { customers, addCustomer, updateCustomer, removeCustomer, addTemplate, updateTemplate, removeTemplate } =
    useCustomers();
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
          admin
          customers={customers}
          selectedId={selectedId}
          onSelect={(id, templateId) => {
            setSelectedId(id);
            if (templateId) setPendingTemplateId(templateId);
          }}
          onAdd={addCustomer}
          onRemove={removeCustomer}
          onUpdateNotes={(id, notes) => updateCustomer(id, { notes })}
        />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border bg-card/40 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex flex-col leading-tight">
              <h1 className="text-sm font-semibold">Admin · Customers & templates</h1>
              <p className="text-xs text-muted-foreground">
                Create customers, author templates, edit saved HTML.
              </p>
            </div>
            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Publisher
            </Link>
          </header>
          <main className="flex-1 overflow-hidden">
            {selected ? (
              <TemplateEditor
                key={selected.id}
                admin
                customer={selected}
                initialTemplateId={pendingTemplateId}
                onAddTemplate={(type, name, platform) =>
                  addTemplate(selected.id, type, name, platform)
                }
                onUpdateTemplate={(tid, patch) => updateTemplate(selected.id, tid, patch)}
                onRemoveTemplate={(tid) => removeTemplate(selected.id, tid)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Add a customer in the sidebar to get started.
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

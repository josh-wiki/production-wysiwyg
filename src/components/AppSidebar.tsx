import {
  Plus,
  Users,
  Trash2,
  Sparkles,
  Search,
  FileText,
  Megaphone,
  ChevronsUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  StickyNote,
  UserPlus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo, useState, type ReactNode } from "react";
import type { Customer } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (id: string, templateId?: string) => void;
  onAdd?: (name: string) => void;
  onRemove?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  admin?: boolean;
}

function SideSection({
  label,
  icon,
  defaultOpen = true,
  children,
}: {
  label: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <SidebarGroup>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {icon}
        <span>{label}</span>
      </button>
      {open && <SidebarGroupContent>{children}</SidebarGroupContent>}
    </SidebarGroup>
  );
}

export function AppSidebar({ customers, selectedId, onSelect, onAdd, onRemove, onUpdateNotes, admin = false }: Props) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v || !onAdd) return;
    onAdd(v);
    setName("");
  };

  const q = query.trim().toLowerCase();

  // Template matches across all customers (only when actively searching).
  // A customer-name match surfaces ALL their templates so you can pick one.
  const templateMatches = useMemo(() => {
    if (!q) return [];
    const out: { customer: Customer; tId: string; tName: string; type: string; platform: string }[] = [];
    for (const c of customers) {
      const customerHit = c.name.toLowerCase().includes(q);
      for (const t of c.templates) {
        const templateHit =
          t.name.toLowerCase().includes(q) ||
          t.platform.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          (t.type === "landing" && "landing page".includes(q)) ||
          (t.type === "blog" && "blog post".includes(q));
        if (customerHit || templateHit) {
          out.push({
            customer: c,
            tId: t.id,
            tName: t.name,
            type: t.type,
            platform: t.platform,
          });
        }
      }
    }
    return out.slice(0, 100);
  }, [customers, q]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Publisher</span>
            <span className="text-xs text-muted-foreground leading-tight">HTML for any CMS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SideSection label="Customer" icon={<Users className="h-3.5 w-3.5" />}>
          <div className="px-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-9 bg-sidebar-accent border-sidebar-border font-normal"
                >
                  {selected ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: selected.brandColor }}
                        aria-hidden
                      />
                      <span className="truncate">{selected.name}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({selected.templates.length})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select customer…</span>
                  )}
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <CommandInput
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Search customer, platform, page…"
                      className="pl-7"
                    />
                  </div>
                  <CommandList className="max-h-[60vh]">
                    <CommandEmpty>No matches.</CommandEmpty>

                    <CommandGroup heading={`Customers (${customers.length})`}>
                      {customers
                        .filter((c) => !q || c.name.toLowerCase().includes(q))
                        .map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              onSelect(c.id);
                              setOpen(false);
                              setQuery("");
                            }}
                            className="group"
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ background: c.brandColor }}
                              aria-hidden
                            />
                            <span className="truncate">{c.name}</span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              {c.templates.length}
                            </span>
                            <Check
                              className={cn(
                                "ml-auto h-3.5 w-3.5",
                                c.id === selectedId ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {admin && onRemove && (
                              <button
                                type="button"
                                aria-label={`Remove ${c.name}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (confirm(`Remove ${c.name}?`)) onRemove(c.id);
                                }}
                                className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </CommandItem>
                        ))}
                    </CommandGroup>

                    {templateMatches.length > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup heading={`Templates (${templateMatches.length})`}>
                          {templateMatches.map((m) => (
                            <CommandItem
                              key={`${m.customer.id}:${m.tId}`}
                              value={`${m.customer.id}:${m.tId}`}
                              onSelect={() => {
                                onSelect(m.customer.id, m.tId);
                                setOpen(false);
                                setQuery("");
                              }}
                            >
                              {m.type === "landing" ? (
                                <Megaphone className="h-3.5 w-3.5" />
                              ) : (
                                <FileText className="h-3.5 w-3.5" />
                              )}
                              <span className="truncate">{m.tName}</span>
                              <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="truncate max-w-[80px]">{m.customer.name}</span>
                                <span className="rounded bg-sidebar-accent px-1 text-[10px] uppercase tracking-wider">
                                  {m.platform}
                                </span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </SideSection>

        {selected && (
          <SideSection
            label="Notes"
            icon={<StickyNote className="h-3.5 w-3.5" />}
            defaultOpen={false}
          >
            <div className="px-2">
              <Textarea
                key={selected.id}
                value={selected.notes ?? ""}
                onChange={(e) => onUpdateNotes?.(selected.id, e.target.value)}
                placeholder="Notes for this customer — brand voice, contacts, gotchas…"
                className="min-h-[120px] bg-sidebar-accent border-sidebar-border text-xs"
                readOnly={!onUpdateNotes}
              />
              {!onUpdateNotes && (
                <p className="mt-1 text-[10px] text-muted-foreground">Read-only</p>
              )}
            </div>
          </SideSection>
        )}

        {admin && (
          <SideSection
            label="Add customer"
            icon={<UserPlus className="h-3.5 w-3.5" />}
            defaultOpen={false}
          >
            <form onSubmit={submit} className="flex gap-2 px-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New customer"
                className="h-8 bg-sidebar-accent border-sidebar-border"
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </SideSection>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

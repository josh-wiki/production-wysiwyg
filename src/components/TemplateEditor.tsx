import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Check,
  Download,
  FileText,
  Megaphone,
  Code2,
  MousePointerClick,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  X,
  Lock,
  Unlock,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer, Template, PageType } from "@/lib/store";
import { PLATFORMS } from "@/lib/store";
import { TemplateTools } from "@/components/TemplateTools";
import { CollapsibleSection } from "@/components/CollapsibleSection";

interface Props {
  customer: Customer;
  initialTemplateId?: string | null;
  onAddTemplate?: (type: PageType, name: string | undefined, platform: string) => Template;
  onUpdateTemplate?: (templateId: string, patch: Partial<Template>) => void;
  onRemoveTemplate?: (templateId: string) => void;
  admin?: boolean;
}

type Mode = "template" | "sandbox";
type EditView = "visual" | "html";

export function TemplateEditor({
  customer,
  initialTemplateId,
  onAddTemplate,
  onUpdateTemplate,
  onRemoveTemplate,
  admin = false,
}: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialTemplateId ?? customer.templates[0]?.id ?? null,
  );

  const [draft, setDraft] = useState<Template | null>(null);
  const [mode, setMode] = useState<Mode>("template");
  const [view, setView] = useState<EditView>("visual");
  const [copied, setCopied] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PageType>("landing");
  const [newPlatform, setNewPlatform] = useState<string>(PLATFORMS[0]);
  const [editing, setEditing] = useState(false);
  const [sandboxMap, setSandboxMap] = useState<Record<string, string>>({});

  // Sync selection from props (e.g. when sidebar picks a template)
  useEffect(() => {
    if (initialTemplateId) setSelectedTemplateId(initialTemplateId);
  }, [initialTemplateId]);

  useEffect(() => {
    if (!customer.templates.find((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(customer.templates[0]?.id ?? null);
    }
  }, [customer.id, customer.templates, selectedTemplateId]);

  const selected = customer.templates.find((t) => t.id === selectedTemplateId) ?? null;

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
    setEditing(false);
  }, [selected?.id]);

  const dirty = useMemo(() => {
    if (!draft || !selected) return false;
    return JSON.stringify(draft) !== JSON.stringify(selected);
  }, [draft, selected]);

  const templateHtml = draft?.html ?? "";
  const sandboxHtml = selected ? (sandboxMap[selected.id] ?? "") : "";

  const setSandboxHtml = (value: string) => {
    if (!selected) return;
    setSandboxMap((m) => ({ ...m, [selected.id]: value }));
  };
  const resetSandbox = () => setSandboxHtml(templateHtml);
  const clearSandbox = () => {
    if (!selected) return;
    setSandboxMap((m) => {
      const next = { ...m };
      delete next[selected.id];
      return next;
    });
  };

  // Seed sandbox first time it is opened
  useEffect(() => {
    if (
      mode === "sandbox" &&
      selected &&
      sandboxMap[selected.id] === undefined &&
      templateHtml
    ) {
      setSandboxMap((m) => ({ ...m, [selected.id]: templateHtml }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected?.id]);

  const outputHtml = mode === "sandbox" ? sandboxHtml || templateHtml : templateHtml;
  const canEdit = mode === "sandbox" || editing;

  const setActiveHtml = (value: string) => {
    if (mode === "sandbox") {
      setSandboxHtml(value);
    } else if (draft) {
      setDraft({ ...draft, html: value });
    }
  };

  const handleSave = () => {
    if (!draft || !selected || !onUpdateTemplate) return;
    onUpdateTemplate(selected.id, draft);
  };

  const handleRevert = () => {
    if (!selected) return;
    setDraft({ ...selected });
  };

  const handleDelete = () => {
    if (!selected || !onRemoveTemplate) return;
    if (!confirm(`Delete template "${selected.name}"?`)) return;
    onRemoveTemplate(selected.id);
  };

  const handleAddTemplate = () => {
    if (!onAddTemplate) return;
    const t = onAddTemplate(newType, newName, newPlatform);
    setSelectedTemplateId(t.id);
    setNewName("");
    setNewType("landing");
    setNewPlatform(PLATFORMS[0]);
    setNewOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = mode === "sandbox" ? "sandbox" : "template";
    a.download = `${customer.id}-${draft?.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ?? "template"}-${label}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Customer + template tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card/40 px-6 py-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: customer.brandColor }}
            aria-hidden
          />
          <h2 className="text-base font-semibold">{customer.name}</h2>
        </div>
        <div className="ml-2 flex flex-wrap gap-1.5">
          {customer.templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplateId(t.id)}
              className={`group inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                t.id === selectedTemplateId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-foreground/80 hover:bg-secondary/80"
              }`}
            >
              {t.type === "landing" ? (
                <Megaphone className="h-3.5 w-3.5" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span className="max-w-[160px] truncate">{t.name}</span>
              <span className="rounded bg-background/20 px-1 text-[10px] uppercase tracking-wider opacity-80">
                {t.platform}
              </span>
            </button>
          ))}
        </div>

        {admin && (newOpen ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-card p-1.5">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Template name"
              className="h-7 w-40"
            />
            <Select value={newType} onValueChange={(v) => setNewType(v as PageType)}>
              <SelectTrigger className="h-7 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">Landing page</SelectItem>
                <SelectItem value="blog">Blog post</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newPlatform} onValueChange={setNewPlatform}>
              <SelectTrigger className="h-7 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7" onClick={handleAddTemplate}>
              Create
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setNewOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="h-8" onClick={() => setNewOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New template
          </Button>
        ))}
      </div>

      {!draft ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          No templates yet — create one to get started.
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mode + actions bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/20 px-4 py-2.5">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="bg-secondary">
                <TabsTrigger
                  value="template"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileText className="mr-1 h-3.5 w-3.5" /> Template
                </TabsTrigger>
                <TabsTrigger
                  value="sandbox"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FlaskConical className="mr-1 h-3.5 w-3.5" /> Sandbox
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "template" ? (
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                  editing
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-secondary/70 text-muted-foreground"
                }`}
              >
                {editing ? (
                  <>
                    <Unlock className="h-3 w-3" /> Editing
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Locked
                  </>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-primary/50 bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                <FlaskConical className="h-3 w-3" /> Scratchpad
              </span>
            )}

            <div className="ml-auto inline-flex rounded-md border border-border bg-secondary p-0.5">
              <button
                onClick={() => setView("visual")}
                className={`inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-xs font-medium transition-colors ${
                  view === "visual"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MousePointerClick className="h-3.5 w-3.5" /> Visual
              </button>
              <button
                onClick={() => setView("html")}
                className={`inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-xs font-medium transition-colors ${
                  view === "html"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" /> HTML
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> .html
            </Button>
            <Button size="sm" onClick={handleCopy} className="min-w-[110px]">
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy HTML
                </>
              )}
            </Button>
          </div>

          {/* Template meta + edit controls */}
          {mode === "template" && admin && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-8 max-w-xs"
                disabled={!editing}
              />
              <Select
                value={draft.platform}
                onValueChange={(v) => setDraft({ ...draft, platform: v })}
                disabled={!editing}
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs capitalize text-muted-foreground">{draft.type}</span>

              <div className="ml-auto flex items-center gap-1.5">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={handleRevert}
                      disabled={!dirty}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revert
                    </Button>
                    <Button size="sm" className="h-8" onClick={handleSave} disabled={!dirty}>
                      <Save className="mr-1 h-3.5 w-3.5" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => {
                        if (dirty && !confirm("Discard unsaved template changes?")) return;
                        if (dirty) handleRevert();
                        setEditing(false);
                      }}
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="h-8" onClick={() => setEditing(true)}>
                    <Unlock className="mr-1 h-3.5 w-3.5" /> Edit template
                  </Button>
                )}
              </div>
            </div>
          )}

          {mode === "sandbox" && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2 text-xs text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              <span>
                One-off scratchpad seeded from the template. Edits stay here and never modify
                the saved template.
              </span>
              <div className="ml-auto flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7" onClick={resetSandbox}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset from template
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={clearSandbox}
                  disabled={sandboxMap[selected?.id ?? ""] === undefined}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {!admin && <TemplateTools html={outputHtml} />}

          {/* Editor body */}
          <CollapsibleSection
            title="Editor"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-auto bg-background p-4">
              {view === "visual" ? (
                <VisualEditor
                  key={`${selected?.id}-${mode}`}
                  html={outputHtml}
                  editable={canEdit}
                  onChange={setActiveHtml}
                />
              ) : (
                <Textarea
                  value={outputHtml}
                  onChange={(e) => setActiveHtml(e.target.value)}
                  readOnly={!canEdit}
                  placeholder="HTML…"
                  className="h-full min-h-[520px] font-mono text-xs"
                />
              )}
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

function VisualEditor({
  html,
  editable,
  onChange,
}: {
  html: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastExternal = useRef(html);

  // Only push external html into the DOM when it actually changes from outside,
  // so the user's caret isn't reset on every keystroke.
  useEffect(() => {
    if (!ref.current) return;
    if (html !== lastExternal.current || ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
      lastExternal.current = html;
    }
  }, [html]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      {!editable && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3 w-3" /> Read-only preview
        </div>
      )}
      <div
        ref={ref}
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={(e) => {
          const next = (e.target as HTMLDivElement).innerHTML;
          lastExternal.current = next;
          onChange(next);
        }}
        className={`min-h-[520px] bg-white text-black outline-none ${
          editable ? "ring-1 ring-primary/30 ring-inset" : ""
        }`}
        style={{ caretColor: "#4f46e5" }}
      />
    </div>
  );
}

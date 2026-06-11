import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  title: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  right,
  className = "",
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border-b border-border ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-1.5 bg-card/30">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {icon}
          {title}
        </button>
        {right && <div className="ml-auto flex items-center gap-1.5">{right}</div>}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

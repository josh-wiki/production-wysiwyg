import { useEffect, useState } from "react";
import {
  generateLandingHtml,
  generateBlogHtml,
  type LandingInput,
  type BlogInput,
} from "./generators";

export type PageType = "landing" | "blog";

export const PLATFORMS = [
  "WordPress",
  "Webflow",
  "HubSpot",
  "Shopify",
  "Contentful",
  "Generic HTML",
] as const;

export interface Template {
  id: string;
  name: string;
  type: PageType;
  platform: string;
  html: string;
}

export interface Customer {
  id: string;
  name: string;
  brandColor: string;
  accentColor: string;
  notes?: string;
  templates: Template[];
}

const KEY = "pubdash.customers.v5";

const defaultLanding: LandingInput = {
  eyebrow: "New release",
  headline: "Ship better pages, faster.",
  subhead:
    "A drop-in landing template your team can publish from any CMS in seconds.",
  imageUrl: "",
  primaryCtaLabel: "Start free trial",
  primaryCtaUrl: "https://example.com/signup",
  secondaryCtaLabel: "See how it works",
  secondaryCtaUrl: "https://example.com/demo",
};

const defaultBlog: BlogInput = {
  title: "How we cut publishing time in half",
  author: "Jane Doe",
  date: "May 17, 2026",
  coverImageUrl: "",
  body: "We used to spend hours wrestling with our CMS editor.\n\nThen we built a publishing dashboard that outputs clean, inline-styled HTML — the kind you can paste anywhere.\n\nHere's what changed and what we learned.",
  tags: "product, workflow",
};

function buildHtml(type: PageType, brandColor: string, accentColor: string) {
  const fake: Customer = {
    id: "_",
    name: "_",
    brandColor,
    accentColor,
    templates: [],
  };
  return type === "landing"
    ? generateLandingHtml(defaultLanding, fake)
    : generateBlogHtml(defaultBlog, fake);
}

export function makeTemplate(
  type: PageType,
  name: string | undefined,
  platform: string,
  brandColor: string,
  accentColor: string,
): Template {
  const id = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    name: name?.trim() || (type === "landing" ? "Landing page" : "Blog post"),
    type,
    platform,
    html: buildHtml(type, brandColor, accentColor),
  };
}

// Deterministic template factory for seeds (stable IDs across SSR/client)
function seedT(
  ownerId: string,
  idx: number,
  type: PageType,
  name: string,
  platform: string,
  brandColor: string,
  accentColor: string,
): Template {
  return {
    id: `${ownerId}-t${idx}`,
    name,
    type,
    platform,
    html: buildHtml(type, brandColor, accentColor),
  };
}

interface SeedSpec {
  id: string;
  name: string;
  brand: string;
  accent: string;
  templates: Array<{ name: string; type: PageType; platform: string }>;
}

const seedSpecs: SeedSpec[] = [
  { id: "acme", name: "Acme Inc.", brand: "#4f46e5", accent: "#a78bfa", templates: [
    { name: "Homepage hero", type: "landing", platform: "WordPress" },
    { name: "Launch post", type: "blog", platform: "WordPress" },
  ]},
  { id: "northwind", name: "Northwind Traders", brand: "#0ea5e9", accent: "#22d3ee", templates: [
    { name: "Product page", type: "landing", platform: "Shopify" },
  ]},
  { id: "globex", name: "Globex Corp.", brand: "#10b981", accent: "#34d399", templates: [
    { name: "Feature launch", type: "landing", platform: "Webflow" },
    { name: "Engineering notes", type: "blog", platform: "HubSpot" },
  ]},
  { id: "initech", name: "Initech", brand: "#ef4444", accent: "#f97316", templates: [
    { name: "Campaign hero", type: "landing", platform: "HubSpot" },
  ]},
  { id: "umbrella", name: "Umbrella Co.", brand: "#dc2626", accent: "#fb7185", templates: [
    { name: "Research update", type: "blog", platform: "Contentful" },
  ]},
  { id: "stark", name: "Stark Industries", brand: "#facc15", accent: "#f59e0b", templates: [
    { name: "Keynote landing", type: "landing", platform: "Webflow" },
    { name: "Press release", type: "blog", platform: "WordPress" },
  ]},
  { id: "wayne", name: "Wayne Enterprises", brand: "#1e293b", accent: "#64748b", templates: [
    { name: "Investor page", type: "landing", platform: "Generic HTML" },
  ]},
  { id: "soylent", name: "Soylent Corp.", brand: "#65a30d", accent: "#a3e635", templates: [
    { name: "Sustainability post", type: "blog", platform: "Contentful" },
  ]},
  { id: "tyrell", name: "Tyrell Corporation", brand: "#7c3aed", accent: "#c084fc", templates: [
    { name: "Product reveal", type: "landing", platform: "Webflow" },
    { name: "Whitepaper teaser", type: "blog", platform: "HubSpot" },
  ]},
  { id: "cyberdyne", name: "Cyberdyne Systems", brand: "#0891b2", accent: "#06b6d4", templates: [
    { name: "AI demo", type: "landing", platform: "Generic HTML" },
  ]},
  { id: "oscorp", name: "Oscorp", brand: "#16a34a", accent: "#4ade80", templates: [
    { name: "Lab tour landing", type: "landing", platform: "WordPress" },
  ]},
  { id: "pied-piper", name: "Pied Piper", brand: "#22c55e", accent: "#86efac", templates: [
    { name: "Compression demo", type: "landing", platform: "Webflow" },
    { name: "Founder update", type: "blog", platform: "WordPress" },
  ]},
  { id: "hooli", name: "Hooli", brand: "#3b82f6", accent: "#60a5fa", templates: [
    { name: "Box launch", type: "landing", platform: "HubSpot" },
  ]},
  { id: "dundermifflin", name: "Dunder Mifflin", brand: "#92400e", accent: "#d97706", templates: [
    { name: "Paper sale", type: "landing", platform: "Shopify" },
    { name: "Scranton blog", type: "blog", platform: "WordPress" },
  ]},
  { id: "vandelay", name: "Vandelay Industries", brand: "#155e75", accent: "#22d3ee", templates: [
    { name: "Import catalog", type: "landing", platform: "Shopify" },
  ]},
  { id: "bluth", name: "Bluth Company", brand: "#fbbf24", accent: "#fde047", templates: [
    { name: "Model home tour", type: "landing", platform: "Webflow" },
  ]},
  { id: "prestige", name: "Prestige Worldwide", brand: "#be185d", accent: "#ec4899", templates: [
    { name: "Event landing", type: "landing", platform: "Generic HTML" },
  ]},
  { id: "duff", name: "Duff Beer Co.", brand: "#b91c1c", accent: "#fb923c", templates: [
    { name: "Summer campaign", type: "landing", platform: "Shopify" },
    { name: "Brewery blog", type: "blog", platform: "WordPress" },
  ]},
  { id: "krusty", name: "Krusty Burger", brand: "#e11d48", accent: "#fde047", templates: [
    { name: "Menu landing", type: "landing", platform: "Shopify" },
  ]},
  { id: "planet-express", name: "Planet Express", brand: "#059669", accent: "#fbbf24", templates: [
    { name: "Shipping landing", type: "landing", platform: "Generic HTML" },
    { name: "Delivery stories", type: "blog", platform: "Contentful" },
  ]},
  { id: "monsters-inc", name: "Monsters Inc.", brand: "#0ea5e9", accent: "#a3e635", templates: [
    { name: "Energy landing", type: "landing", platform: "Webflow" },
  ]},
  { id: "los-pollos", name: "Los Pollos Hermanos", brand: "#facc15", accent: "#ef4444", templates: [
    { name: "Storefront page", type: "landing", platform: "Shopify" },
  ]},
  { id: "rekall", name: "Rekall", brand: "#7c3aed", accent: "#f472b6", templates: [
    { name: "Memory packages", type: "landing", platform: "HubSpot" },
    { name: "Customer stories", type: "blog", platform: "WordPress" },
  ]},
  { id: "weyland", name: "Weyland-Yutani", brand: "#0f172a", accent: "#38bdf8", templates: [
    { name: "Mission landing", type: "landing", platform: "Generic HTML" },
  ]},
  { id: "abstergo", name: "Abstergo Industries", brand: "#475569", accent: "#94a3b8", templates: [
    { name: "Corporate landing", type: "landing", platform: "Contentful" },
    { name: "Research blog", type: "blog", platform: "Contentful" },
  ]},
];

const seed: Customer[] = seedSpecs.map((s) => ({
  id: s.id,
  name: s.name,
  brandColor: s.brand,
  accentColor: s.accent,
  templates: s.templates.map((t, i) =>
    seedT(s.id, i, t.type, t.name, t.platform, s.brand, s.accent),
  ),
}));

function read(): Customer[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Customer[];
    return parsed.map((c) => ({ ...c, templates: c.templates ?? [] }));
  } catch {
    return seed;
  }
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCustomers(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(customers));
  }, [customers, hydrated]);

  const addCustomer = (name: string) => {
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "c";
    setCustomers((prev) => [
      ...prev,
      {
        id: `${slug}-${Date.now().toString(36)}`,
        name,
        brandColor: "#4f46e5",
        accentColor: "#a78bfa",
        templates: [
          makeTemplate("landing", undefined, "Generic HTML", "#4f46e5", "#a78bfa"),
        ],
      },
    ]);
  };

  const updateCustomer = (id: string, patch: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const addTemplate = (
    customerId: string,
    type: PageType,
    name: string | undefined,
    platform: string,
  ): Template => {
    const c = customers.find((x) => x.id === customerId);
    const t = makeTemplate(
      type,
      name,
      platform,
      c?.brandColor ?? "#4f46e5",
      c?.accentColor ?? "#a78bfa",
    );
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, templates: [...c.templates, t] } : c,
      ),
    );
    return t;
  };

  const updateTemplate = (
    customerId: string,
    templateId: string,
    patch: Partial<Template>,
  ) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              templates: c.templates.map((t) =>
                t.id === templateId ? { ...t, ...patch } : t,
              ),
            }
          : c,
      ),
    );
  };

  const removeTemplate = (customerId: string, templateId: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, templates: c.templates.filter((t) => t.id !== templateId) }
          : c,
      ),
    );
  };

  return {
    customers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    addTemplate,
    updateTemplate,
    removeTemplate,
  };
}

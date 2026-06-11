import type { Customer } from "./store";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escAttr = (s: string) => esc(s);

export interface LandingInput {
  eyebrow: string;
  headline: string;
  subhead: string;
  imageUrl: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
}

export interface BlogInput {
  title: string;
  author: string;
  date: string;
  coverImageUrl: string;
  body: string;
  tags: string;
}

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function generateLandingHtml(input: LandingInput, customer: Customer): string {
  const brand = customer.brandColor;
  const accent = customer.accentColor;
  const img = input.imageUrl
    ? `<img src="${escAttr(input.imageUrl)}" alt="${escAttr(input.headline)}" style="display:block;width:100%;max-width:560px;height:auto;border-radius:16px;margin:0 auto 32px;box-shadow:0 20px 50px -20px rgba(15,23,42,0.35);" />`
    : "";

  const secondary = input.secondaryCtaLabel
    ? `<a href="${escAttr(input.secondaryCtaUrl || "#")}" style="display:inline-block;padding:14px 26px;margin:8px;border-radius:10px;background:transparent;color:${brand};font-weight:600;font-size:16px;text-decoration:none;border:1.5px solid ${brand};font-family:${fontStack};">${esc(input.secondaryCtaLabel)}</a>`
    : "";

  return `<section style="font-family:${fontStack};background:linear-gradient(180deg,#ffffff,#f4f4fb);padding:72px 24px;text-align:center;color:#0f172a;">
  <div style="max-width:760px;margin:0 auto;">
    ${input.eyebrow ? `<p style="margin:0 0 16px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${brand};">${esc(input.eyebrow)}</p>` : ""}
    <h1 style="margin:0 0 20px;font-size:48px;line-height:1.1;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${esc(input.headline)}</h1>
    ${input.subhead ? `<p style="margin:0 auto 36px;font-size:19px;line-height:1.55;color:#475569;max-width:620px;">${esc(input.subhead)}</p>` : ""}
    ${img}
    <div style="margin-top:8px;">
      <a href="${escAttr(input.primaryCtaUrl || "#")}" style="display:inline-block;padding:14px 28px;margin:8px;border-radius:10px;background:linear-gradient(135deg,${brand},${accent});color:#ffffff;font-weight:600;font-size:16px;text-decoration:none;box-shadow:0 12px 30px -10px ${brand}80;font-family:${fontStack};">${esc(input.primaryCtaLabel || "Get started")}</a>
      ${secondary}
    </div>
  </div>
</section>`;
}

export function generateBlogHtml(input: BlogInput, customer: Customer): string {
  const brand = customer.brandColor;
  const cover = input.coverImageUrl
    ? `<img src="${escAttr(input.coverImageUrl)}" alt="${escAttr(input.title)}" style="display:block;width:100%;height:auto;border-radius:14px;margin:0 0 32px;" />`
    : "";

  const tagList = input.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map(
      (t) =>
        `<span style="display:inline-block;padding:4px 10px;margin:4px 6px 0 0;border-radius:999px;background:${brand}14;color:${brand};font-size:12px;font-weight:600;letter-spacing:0.02em;">${esc(t)}</span>`,
    )
    .join("");

  const paragraphs = input.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 20px;font-size:18px;line-height:1.7;color:#1f2937;">${esc(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");

  return `<article style="font-family:${fontStack};max-width:720px;margin:0 auto;padding:48px 24px;color:#0f172a;">
  ${cover}
  <header style="margin-bottom:28px;">
    <h1 style="margin:0 0 14px;font-size:40px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">${esc(input.title)}</h1>
    <p style="margin:0;font-size:14px;color:#64748b;">
      ${input.author ? `<span style="color:${brand};font-weight:600;">${esc(input.author)}</span>` : ""}
      ${input.author && input.date ? " &middot; " : ""}
      ${input.date ? esc(input.date) : ""}
    </p>
  </header>
  <div>${paragraphs}</div>
  ${tagList ? `<footer style="margin-top:36px;padding-top:24px;border-top:1px solid #e2e8f0;">${tagList}</footer>` : ""}
</article>`;
}

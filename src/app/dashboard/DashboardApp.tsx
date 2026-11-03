"use client";
/* eslint-disable @next/next/no-img-element -- thumbnails come from the database via /api/img or local blob previews */
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { get, onValue, push, ref, remove, serverTimestamp, set, update } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { base64ToObjectUrl, imageSrc, prepareImage } from "@/lib/images";
import { programTiming } from "@/lib/program-status";
import type { DbCommunityPhoto, AchievementLabel, DbAchievement, DbJourney, DbMentor, DbOpening, DbPost, DbProgram, DbProject, DbTeam, DbTepSections, DbTestimonial, ProgramStatus, TepSectionKey, WithId } from "@/content/dynamic";
import { TEAM } from "@/content/team";
import { JOURNEY, TEP_INTRO, TOOLKIT } from "@/content/tep";
import { ChipPicker } from "./ChipPicker";
import { ALL_SECTIONS, SECTIONS, Shell, ListSkeleton, askConfirm, notify } from "./shell";

type TabProps = { startNew?: boolean };

/* ---------- small helpers ---------- */
const input = "mt-1 block min-h-11 w-full rounded-md border border-line-strong bg-wash px-3 py-2 text-ink placeholder:text-muted/70";
const btn = "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
const btnPrimary = `${btn} bg-glow text-forest hover:bg-glow-hi`;
const btnGhost = `${btn} border border-line-strong hover:border-brand-text hover:text-brand-text`;
const btnDanger = `${btn} border border-error text-error hover:bg-error hover:text-forest`;

const errText = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  if (/permission[_ ]denied/i.test(m)) return "Permission denied. Publish database.rules.json in the Firebase console and add your UID under /admins (see the Setup tab).";
  return m;
};
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
const isUrl = (s: string) => { try { return /^https?:$/.test(new URL(s).protocol); } catch { return false; } };

function useList<T extends object>(path: string, enabled: boolean) {
  const [rows, setRows] = useState<WithId<T>[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    return onValue(ref(database(), path), (s) => { const v = (s.val() ?? {}) as Record<string, T>; setRows(Object.entries(v).map(([id, x]) => ({ id, ...x }))); setError(""); }, (e) => setError(errText(e)));
  }, [path, enabled]);
  return { rows, error };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}</label>;
}

/** One image slot: uploads the lossless original + a preview to /images/{id}, and cleans up replaced or abandoned uploads. */
function useImageSlot(original?: string) {
  const [id, setId] = useState<string | undefined>(original);
  const [fresh, setFresh] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [local, setLocal] = useState("");
  const upload = useCallback(async (file: File) => {
    setBusy(true); setError("");
    try {
      const img = await prepareImage(file);
      const key = push(ref(database(), "images")).key!;
      await set(ref(database(), `images/${key}`), { mime: img.mime, name: img.name, size: img.size, full: img.full, thumb: img.thumb, createdAt: serverTimestamp() });
      setLocal(base64ToObjectUrl(img.thumb, "image/webp")); setFresh((f) => [...f, key]); setId(key);
    } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  }, []);
  const clear = () => { setId(undefined); setLocal(""); };
  /** After a successful save: delete the image this one replaced. */
  const commit = async () => { if (original && original !== id) await remove(ref(database(), `images/${original}`)).catch(() => {}); };
  /** After cancel: delete anything uploaded but not saved. */
  const discard = async () => { await Promise.all(fresh.map((k) => remove(ref(database(), `images/${k}`)).catch(() => {}))); };
  return { id, busy, error, local, upload, clear, commit, discard };
}
type Slot = ReturnType<typeof useImageSlot>;

function ImageField({ slot, label }: { slot: Slot; label: string }) {
  const src = slot.local || imageSrc(slot.id);
  const [over, setOver] = useState(false);
  const take = (f?: File | null) => { if (f) void slot.upload(f); };
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}
        className={`mt-1 flex cursor-pointer flex-wrap items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors focus-within:border-glow ${over ? "border-glow bg-glow/10" : "border-line-strong hover:border-brand-text"} ${slot.busy ? "pointer-events-none opacity-60" : ""}`}>
        {src ? <img src={src} alt="" className="h-28 w-40 rounded-md border border-line object-cover" /> : <span className="grid h-28 w-40 place-items-center rounded-md bg-paper text-center text-xs text-muted">No photo yet</span>}
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block font-semibold">{slot.busy ? "Uploading…" : src ? "Drop a new photo here to replace it" : "Drop a photo here"}</span>
          <span className="block text-sm text-muted">or <span className="font-semibold text-brand-text underline underline-offset-4">choose a file</span>. JPG, PNG, WebP, GIF or AVIF, up to 7.5 MB. The original is kept exactly as uploaded.</span>
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={slot.busy} aria-label={`${label}: choose a file`} className="sr-only" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {slot.id && <button type="button" className="mt-2 text-sm text-brand-text underline underline-offset-4" onClick={slot.clear}>Remove photo</button>}
      {slot.error && <p role="alert" className="mt-2 text-sm text-error">{slot.error}</p>}
    </div>
  );
}

/* ---------- sign-in ---------- */
function SignIn() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await signInWithEmailAndPassword(auth(), email.trim(), pw); }
    catch (x) { const c = (x as { code?: string }).code ?? ""; setErr(/too-many/.test(c) ? "Too many attempts. Wait a few minutes and try again." : /network/.test(c) ? "Network error. Check your connection." : "Email or password is incorrect."); }
    finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-full place-items-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5" aria-labelledby="signin-h">
        <div><h1 id="signin-h" className="display text-4xl">Sign in</h1><p className="mt-2 text-muted">Manage the DeboisTech website: programs, photos, team and more.</p></div>
        <Field label="Email"><input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className={input} type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        {err && <p role="alert" className="text-sm text-error">{err}</p>}
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

/* ---------- programs ---------- */
const STATUS_LABEL: Record<ProgramStatus, string> = { current: "Current (ongoing)", upcoming: "Upcoming", past: "Past" };

function ProgramForm({ initial, all, onDone }: { initial?: WithId<DbProgram>; all: WithId<DbProgram>[]; onDone: () => void }) {
  const slot = useImageSlot(initial?.imageId);
  const [v, setV] = useState<DbProgram>(initial ?? { title: "", status: "current", summary: "", flagship: false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set_ = (k: keyof DbProgram) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.title.trim() || !v.summary.trim()) return setErr("Title and summary are required.");
    if (v.applyUrl && !isUrl(v.applyUrl)) return setErr("The link must start with http:// or https://");
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "programs")).key!;
      const rec: DbProgram = { ...v, title: v.title.trim(), summary: v.summary.trim(), imageId: slot.id, order: v.order ?? all.length, updatedAt: Date.now() };
      Object.keys(rec).forEach((k) => { const key = k as keyof DbProgram; if (rec[key] === undefined || rec[key] === "") delete rec[key]; });
      const updates: Record<string, unknown> = { [`programs/${id}`]: rec };
      if (rec.flagship) all.filter((p) => p.id !== id && p.flagship).forEach((p) => { updates[`programs/${p.id}/flagship`] = null; }); // only one flagship
      await update(ref(database()), updates);
      await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit program" : "Add program"}</h3>
      <Field label="Title *"><input className={input} value={v.title} onChange={set_("title")} required /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Fallback status * (used only when the dates below are empty or unreadable; otherwise the site works it out from the dates)"><select className={input} value={v.status} onChange={set_("status")}>{(Object.keys(STATUS_LABEL) as ProgramStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
        <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={!!v.flagship} onChange={(e) => setV((p) => ({ ...p, flagship: e.target.checked }))} /> Flagship program (Technology Excellence Program)</label>
      </div>
      <Field label="Summary *" hint="One or two sentences, shown on the Program page."><textarea className={input} rows={3} value={v.summary} onChange={set_("summary")} required /></Field>
      <Field label="Details" hint="Longer description. Blank line = new paragraph."><textarea className={input} rows={5} value={v.details ?? ""} onChange={set_("details")} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Start date"><input className={input} value={v.startDate ?? ""} onChange={set_("startDate")} placeholder="e.g. 9 August 2026 or 2026-08-09" /></Field>
        <Field label="End date"><input className={input} value={v.endDate ?? ""} onChange={set_("endDate")} placeholder="e.g. 4 October 2026" /></Field>
        <Field label="Duration"><input className={input} value={v.duration ?? ""} onChange={set_("duration")} placeholder="e.g. 8 weeks" /></Field>
        <Field label="Fee"><input className={input} value={v.fee ?? ""} onChange={set_("fee")} placeholder="e.g. ₹15,000" /></Field>
      </div>
      <Field label="Apply / more-info link"><input className={input} type="url" value={v.applyUrl ?? ""} onChange={set_("applyUrl")} placeholder="https://…" /></Field>
      <ImageField slot={slot} label="Image" />
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save program"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}

function ProgramsTab({ startNew }: TabProps) {
  const { rows, error } = useList<DbProgram>("programs", true);
  const [editing, setEditing] = useState<WithId<DbProgram> | "new" | null>(startNew ? "new" : null);
  const all = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [rows]);
  const eff = (p: WithId<DbProgram>) => programTiming(p).status; // same date-based rule as the public page
  const groups: [string, WithId<DbProgram>[]][] = [["Flagship", all.filter((p) => p.flagship)], ["Current (ongoing)", all.filter((p) => !p.flagship && eff(p) === "current")], ["Upcoming", all.filter((p) => !p.flagship && eff(p) === "upcoming")], ["Past", all.filter((p) => !p.flagship && eff(p) === "past")]];
  const del = async (p: WithId<DbProgram>) => { if (!(await askConfirm({ title: `Delete "${p.title}"?`, body: "This cannot be undone.", confirmLabel: "Delete" }))) return; try { await remove(ref(database(), `programs/${p.id}`)); if (p.imageId) await remove(ref(database(), `images/${p.imageId}`)).catch(() => {}); notify("Deleted."); } catch (e) { notify(errText(e), "error"); } };
  if (editing) return <ProgramForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} all={all} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><p className="text-muted">Shown on the public Program page. Past programs stay listed as history.</p><button className={btnPrimary} onClick={() => setEditing("new")}>Add program</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {rows === null && !error && <ListSkeleton />}
      {rows && rows.length === 0 && <p className="rounded-xl border border-dashed border-line-strong p-6 text-muted">No programs yet. Add one, or use “Import current content” in the Setup tab to bring in the Technology Excellence Program.</p>}
      {groups.filter(([, g]) => g.length).map(([name, g]) => (
        <section key={name}><h3 className="mb-3 text-lg font-bold">{name}</h3>
          <ul className="divide-y divide-line rounded-xl border border-line">{g.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              {p.imageId ? <img src={imageSrc(p.imageId)} alt="" className="size-14 rounded-md object-cover" /> : <div className="size-14 rounded-md border border-dashed border-line-strong" />}
              <div className="mr-auto min-w-0"><p className="font-semibold">{p.title}{p.flagship && <span className="ml-2 rounded-full border border-brand-text px-2 py-0.5 text-xs text-brand-text">Flagship</span>}</p><p className="truncate text-sm text-muted">{STATUS_LABEL[eff(p)]}{programTiming(p).auto ? " (from dates)" : ""}{p.startDate ? ` · ${p.startDate}` : ""}</p></div>
              <button className={btnGhost} onClick={() => setEditing(p)}>Edit</button><button className={btnDanger} onClick={() => void del(p)}>Delete</button>
            </li>))}</ul></section>))}
    </div>
  );
}

/* ---------- team ---------- */
function TeamForm({ initial, count, onDone }: { initial?: WithId<DbTeam>; count: number; onDone: () => void }) {
  const slot = useImageSlot(initial?.imageId);
  const [v, setV] = useState<DbTeam>(initial ?? { name: "", title: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.name.trim() || !v.title.trim()) return setErr("Name and title are required.");
    if (v.linkedin && !isUrl(v.linkedin)) return setErr("The LinkedIn link must start with http:// or https://");
    if (!slot.id) return setErr("Add a photo.");
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "team")).key!;
      const rec: DbTeam = { name: v.name.trim(), title: v.title.trim(), imageId: slot.id, order: v.order ?? count, ...(v.linkedin ? { linkedin: v.linkedin.trim() } : {}) };
      await set(ref(database(), `team/${id}`), rec); await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit team member" : "Add team member"}</h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name *"><input className={input} value={v.name} onChange={(e) => setV((p) => ({ ...p, name: e.target.value }))} required /></Field>
        <Field label="Title *"><input className={input} value={v.title} onChange={(e) => setV((p) => ({ ...p, title: e.target.value }))} required /></Field>
      </div>
      <Field label="LinkedIn URL" hint="Optional. Leave blank to show no link."><input className={input} type="url" value={v.linkedin ?? ""} onChange={(e) => setV((p) => ({ ...p, linkedin: e.target.value }))} placeholder="https://www.linkedin.com/in/…" /></Field>
      <ImageField slot={slot} label="Photo *" />
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save member"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}

function TeamTab({ startNew }: TabProps) {
  const { rows, error } = useList<DbTeam>("team", true);
  const [editing, setEditing] = useState<WithId<DbTeam> | "new" | null>(startNew ? "new" : null);
  const all = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [rows]);
  const move = async (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= all.length) return; const order = all.map((m) => m.id); [order[i], order[j]] = [order[j], order[i]]; const u: Record<string, number> = {}; order.forEach((id, k) => { u[`team/${id}/order`] = k; }); await update(ref(database()), u); };
  const del = async (m: WithId<DbTeam>) => { if (!(await askConfirm({ title: `Remove ${m.name} from the team?`, body: "This cannot be undone.", confirmLabel: "Remove" }))) return; try { await remove(ref(database(), `team/${m.id}`)); if (m.imageId) await remove(ref(database(), `images/${m.imageId}`)).catch(() => {}); notify("Removed."); } catch (e) { notify(errText(e), "error"); } };
  if (editing) return <TeamForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} count={all.length} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-muted">Order here is the order on the website. Photos are stored losslessly.</p><button className={btnPrimary} onClick={() => setEditing("new")}>Add member</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {rows === null && !error && <ListSkeleton />}
      {rows && rows.length === 0 && <p className="rounded-xl border border-dashed border-line-strong p-6 text-muted">No team members in the database yet, so the website shows its built-in team. Use “Import current content” in the Setup tab to copy that team here, then edit it.</p>}
      <ul className="divide-y divide-line rounded-xl border border-line">
        {all.map((m, i) => (
          <li key={m.id} className="flex flex-wrap items-center gap-4 p-4">
            <img src={imageSrc(m.imageId)} alt="" className="size-14 rounded-md object-cover" />
            <div className="mr-auto min-w-0"><p className="font-semibold">{m.name}</p><p className="text-sm text-muted">{m.title}</p></div>
            <button className={btnGhost} onClick={() => void move(i, -1)} disabled={i === 0} aria-label={`Move ${m.name} up`}>↑</button>
            <button className={btnGhost} onClick={() => void move(i, 1)} disabled={i === all.length - 1} aria-label={`Move ${m.name} down`}>↓</button>
            <button className={btnGhost} onClick={() => setEditing(m)}>Edit</button><button className={btnDanger} onClick={() => void del(m)}>Delete</button>
          </li>))}
      </ul>
    </div>
  );
}

/* ---------- blog ---------- */
type PostRow = WithId<DbPost> & { published: boolean };

function PostForm({ initial, posts, onDone }: { initial?: PostRow; posts: PostRow[]; onDone: () => void }) {
  const slot = useImageSlot(initial?.coverImageId);
  const [v, setV] = useState({ title: initial?.title ?? "", slug: initial?.slug ?? "", excerpt: initial?.excerpt ?? "", body: initial?.body ?? "", author: initial?.author ?? "", tags: (initial?.tags ?? []).join(", "), publish: initial?.published ?? false });
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    const slug = slugify(v.slug || v.title);
    if (!v.title.trim() || !v.excerpt.trim() || !v.body.trim()) return setErr("Title, excerpt and body are required.");
    if (!slug) return setErr("Add a title or slug.");
    if (posts.some((p) => p.id !== initial?.id && p.slug === slug)) return setErr(`Another post already uses the address /blog/${slug}. Change the slug.`);
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "posts")).key!;
      const rec: DbPost = { title: v.title.trim(), slug, excerpt: v.excerpt.trim(), body: v.body.replace(/\r\n/g, "\n").trim(), updatedAt: Date.now(),
        ...(v.author.trim() ? { author: v.author.trim() } : {}), ...(v.tags.trim() ? { tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8) } : {}), ...(slot.id ? { coverImageId: slot.id } : {}),
        ...(v.publish ? { publishedAt: initial?.published && initial.publishedAt ? initial.publishedAt : Date.now() } : {}) };
      // Drafts live apart from published posts, so unpublished writing is never readable by the public.
      await update(ref(database()), { [`${v.publish ? "posts" : "drafts"}/${id}`]: rec, [`${v.publish ? "drafts" : "posts"}/${id}`]: null });
      await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit post" : "New post"}</h3>
      <Field label="Title *"><input className={input} value={v.title} required onChange={(e) => setV((p) => ({ ...p, title: e.target.value, slug: slugTouched ? p.slug : slugify(e.target.value) }))} /></Field>
      <Field label="Web address" hint={`Appears as /blog/${slugify(v.slug || v.title) || "…"}`}><input className={input} value={v.slug} onChange={(e) => { setSlugTouched(true); setV((p) => ({ ...p, slug: e.target.value })); }} /></Field>
      <Field label="Excerpt *" hint="One or two sentences for the blog list and search results."><textarea className={input} rows={2} value={v.excerpt} onChange={(e) => setV((p) => ({ ...p, excerpt: e.target.value }))} required /></Field>
      <Field label="Body *" hint="Blank line = new paragraph. Start a line with “## ” for a heading, or “- ” for a bullet list. Plain text only: no HTML."><textarea className={`${input} font-mono text-sm`} rows={14} value={v.body} onChange={(e) => setV((p) => ({ ...p, body: e.target.value }))} required /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Author"><input className={input} value={v.author} onChange={(e) => setV((p) => ({ ...p, author: e.target.value }))} /></Field>
        <Field label="Tags" hint="Comma separated."><input className={input} value={v.tags} onChange={(e) => setV((p) => ({ ...p, tags: e.target.value }))} /></Field>
      </div>
      <ImageField slot={slot} label="Cover image" />
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.publish} onChange={(e) => setV((p) => ({ ...p, publish: e.target.checked }))} /> Published (visible on the website). Untick to keep as a draft.</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : v.publish ? "Save and publish" : "Save draft"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}

function BlogTab({ startNew }: TabProps) {
  const pub = useList<DbPost>("posts", true), dr = useList<DbPost>("drafts", true);
  const [editing, setEditing] = useState<PostRow | "new" | null>(startNew ? "new" : null);
  const posts: PostRow[] = useMemo(() => [...(pub.rows ?? []).map((p) => ({ ...p, published: true })), ...(dr.rows ?? []).map((p) => ({ ...p, published: false }))].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)), [pub.rows, dr.rows]);
  const del = async (p: PostRow) => { if (!(await askConfirm({ title: `Delete "${p.title}"?`, body: "This cannot be undone.", confirmLabel: "Delete" }))) return; try { await remove(ref(database(), `${p.published ? "posts" : "drafts"}/${p.id}`)); if (p.coverImageId) await remove(ref(database(), `images/${p.coverImageId}`)).catch(() => {}); notify("Deleted."); } catch (e) { notify(errText(e), "error"); } };
  const error = pub.error || dr.error;
  if (editing) return <PostForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} posts={posts} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-muted">Published posts appear at /blog. Drafts are private.</p><button className={btnPrimary} onClick={() => setEditing("new")}>New post</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {pub.rows === null && !error && <ListSkeleton />}
      {pub.rows && posts.length === 0 && <p className="rounded-xl border border-dashed border-line-strong p-6 text-muted">No posts yet.</p>}
      <ul className="divide-y divide-line rounded-xl border border-line">{posts.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
          <div className="mr-auto min-w-0"><p className="font-semibold">{p.title}</p><p className="truncate text-sm text-muted">{p.published ? `Published · /blog/${p.slug}` : "Draft"}{p.updatedAt ? ` · edited ${new Date(p.updatedAt).toLocaleDateString("en-IN")}` : ""}</p></div>
          {p.published && <a className={btnGhost} href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">View</a>}
          <button className={btnGhost} onClick={() => setEditing(p)}>Edit</button><button className={btnDanger} onClick={() => void del(p)}>Delete</button>
        </li>))}</ul>
    </div>
  );
}

/* ---------- careers ---------- */
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function OpeningForm({ initial, openings, onDone }: { initial?: WithId<DbOpening>; openings: WithId<DbOpening>[]; onDone: () => void }) {
  const [v, setV] = useState({ title: initial?.title ?? "", slug: initial?.slug ?? "", location: initial?.location ?? "Nashik", type: initial?.type ?? "Full-time", summary: initial?.summary ?? "",
    responsibilities: (initial?.responsibilities ?? []).join("\n"), requirements: (initial?.requirements ?? []).join("\n"), applyUrl: initial?.applyUrl ?? "", open: initial?.open ?? true });
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    const slug = slugify(v.slug || v.title);
    if (!v.title.trim() || !v.location.trim() || !v.type.trim()) return setErr("Title, location and type are required.");
    if (!slug) return setErr("Add a title or slug.");
    if (openings.some((o) => o.id !== initial?.id && o.slug === slug)) return setErr(`Another role already uses the slug "${slug}". Change it.`);
    if (v.applyUrl && !isUrl(v.applyUrl.trim()) && !/^mailto:[^\s@]+@[^\s@]+$/.test(v.applyUrl.trim())) return setErr("The apply link must start with http://, https:// or mailto:");
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "openings")).key!;
      const resp = lines(v.responsibilities), reqs = lines(v.requirements);
      const rec: DbOpening = { title: v.title.trim(), slug, location: v.location.trim(), type: v.type.trim(), open: v.open, order: initial?.order ?? openings.length, updatedAt: Date.now(),
        ...(v.summary.trim() ? { summary: v.summary.trim() } : {}), ...(resp.length ? { responsibilities: resp } : {}), ...(reqs.length ? { requirements: reqs } : {}), ...(v.applyUrl.trim() ? { applyUrl: v.applyUrl.trim() } : {}) };
      await set(ref(database(), `openings/${id}`), rec); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit role" : "Add role"}</h3>
      <Field label="Job title *"><input className={input} value={v.title} required onChange={(e) => setV((p) => ({ ...p, title: e.target.value, slug: slugTouched ? p.slug : slugify(e.target.value) }))} /></Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Location *"><input className={input} value={v.location} onChange={(e) => setV((p) => ({ ...p, location: e.target.value }))} required /></Field>
        <Field label="Type *"><input className={input} value={v.type} onChange={(e) => setV((p) => ({ ...p, type: e.target.value }))} placeholder="Full-time, Internship…" required /></Field>
        <Field label="Slug" hint="Used to track applications."><input className={input} value={v.slug} onChange={(e) => { setSlugTouched(true); setV((p) => ({ ...p, slug: e.target.value })); }} /></Field>
      </div>
      <Field label="Summary" hint="One or two sentences about the role."><textarea className={input} rows={3} value={v.summary} onChange={(e) => setV((p) => ({ ...p, summary: e.target.value }))} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Responsibilities" hint="One per line."><textarea className={input} rows={6} value={v.responsibilities} onChange={(e) => setV((p) => ({ ...p, responsibilities: e.target.value }))} /></Field>
        <Field label="Requirements" hint="One per line."><textarea className={input} rows={6} value={v.requirements} onChange={(e) => setV((p) => ({ ...p, requirements: e.target.value }))} /></Field>
      </div>
      <Field label="Apply link" hint="Optional. Blank sends applicants to the Contact form (Careers)."><input className={input} value={v.applyUrl} onChange={(e) => setV((p) => ({ ...p, applyUrl: e.target.value }))} placeholder="https://… or mailto:careers@…" /></Field>
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.open} onChange={(e) => setV((p) => ({ ...p, open: e.target.checked }))} /> Open (shown on the Careers page). Untick once the role is filled.</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save role"}</button><button type="button" className={btnGhost} onClick={onDone}>Cancel</button></div>
    </form>
  );
}

function CareersTab({ startNew }: TabProps) {
  const { rows, error } = useList<DbOpening>("openings", true);
  const [editing, setEditing] = useState<WithId<DbOpening> | "new" | null>(startNew ? "new" : null);
  const all = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [rows]);
  const move = async (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= all.length) return; const order = all.map((o) => o.id); [order[i], order[j]] = [order[j], order[i]]; const u: Record<string, number> = {}; order.forEach((id, k) => { u[`openings/${id}/order`] = k; }); await update(ref(database()), u); };
  const toggle = async (o: WithId<DbOpening>) => { await update(ref(database()), { [`openings/${o.id}/open`]: !o.open, [`openings/${o.id}/updatedAt`]: serverTimestamp() }); };
  const del = async (o: WithId<DbOpening>) => { if (!(await askConfirm({ title: `Delete "${o.title}"?`, body: "This cannot be undone.", confirmLabel: "Delete" }))) return; try { await remove(ref(database(), `openings/${o.id}`)); notify("Deleted."); } catch (e) { notify(errText(e), "error"); } };
  if (editing) return <OpeningForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} openings={all} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-muted">Open roles appear at /careers. With none open, the page invites people to get in touch.</p><button className={btnPrimary} onClick={() => setEditing("new")}>Add role</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {rows === null && !error && <ListSkeleton />}
      {rows && rows.length === 0 && <p className="rounded-xl border border-dashed border-line-strong p-6 text-muted">No roles yet. The Careers page currently shows “No current openings”.</p>}
      <ul className="divide-y divide-line rounded-xl border border-line">
        {all.map((o, i) => (
          <li key={o.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="mr-auto min-w-0"><p className="font-semibold">{o.title}<span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${o.open ? "border-brand-text text-brand-text" : "border-line-strong text-muted"}`}>{o.open ? "Open" : "Closed"}</span></p><p className="truncate text-sm text-muted">{o.location} · {o.type}</p></div>
            <button className={btnGhost} onClick={() => void move(i, -1)} disabled={i === 0} aria-label={`Move ${o.title} up`}>↑</button>
            <button className={btnGhost} onClick={() => void move(i, 1)} disabled={i === all.length - 1} aria-label={`Move ${o.title} down`}>↓</button>
            <button className={btnGhost} onClick={() => void toggle(o)}>{o.open ? "Close" : "Reopen"}</button>
            <button className={btnGhost} onClick={() => setEditing(o)}>Edit</button><button className={btnDanger} onClick={() => void del(o)}>Delete</button>
          </li>))}
      </ul>
    </div>
  );
}

/* ---------- testimonials ---------- */
function TestimonialForm({ initial, all, onDone }: { initial?: WithId<DbTestimonial>; all: WithId<DbTestimonial>[]; onDone: () => void }) {
  const slot = useImageSlot(initial?.imageId);
  const [v, setV] = useState({ quote: initial?.quote ?? "", name: initial?.name ?? "", role: initial?.role ?? "", company: initial?.company ?? "", program: initial?.program ?? "", linkedin: initial?.linkedin ?? "", videoUrl: initial?.videoUrl ?? "",
    kind: (initial?.kind ?? "client") as "client" | "learner", featured: initial?.featured ?? false, published: initial?.published ?? true });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.quote.trim() || !v.name.trim()) return setErr("The quote and the name are required.");
    for (const [label, url] of [["LinkedIn", v.linkedin], ["Video", v.videoUrl]] as const) if (url.trim() && !isUrl(url.trim())) return setErr(`The ${label} link must start with http:// or https://`);
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "testimonials")).key!;
      const rec: DbTestimonial = { quote: v.quote.replace(/\r\n/g, "\n").trim(), name: v.name.trim(), published: v.published, kind: v.kind, order: initial?.order ?? all.length, updatedAt: Date.now(),
        ...(v.role.trim() ? { role: v.role.trim() } : {}), ...(v.company.trim() ? { company: v.company.trim() } : {}), ...(v.program.trim() ? { program: v.program.trim() } : {}),
        ...(v.linkedin.trim() ? { linkedin: v.linkedin.trim() } : {}), ...(v.videoUrl.trim() ? { videoUrl: v.videoUrl.trim() } : {}), ...(slot.id ? { imageId: slot.id } : {}), ...(v.featured ? { featured: true } : {}) };
      await set(ref(database(), `testimonials/${id}`), rec); await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  const t = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit testimonial" : "Add testimonial"}</h3>
      <Field label="Shown on"><select className={input} value={v.kind} onChange={(e) => setV((p) => ({ ...p, kind: e.target.value as "client" | "learner" }))}><option value="client">Services page: client voice</option><option value="learner">TEP page: learner voice</option></select></Field>
      <Field label="Quote *" hint="What they said, without quotation marks."><textarea className={input} rows={5} value={v.quote} onChange={t("quote")} required /></Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Name *"><input className={input} value={v.name} onChange={t("name")} required /></Field>
        <Field label={v.kind === "learner" ? "Role or course" : "Role"}><input className={input} value={v.role} onChange={t("role")} placeholder={v.kind === "learner" ? "e.g. B.E. student" : "e.g. Founder"} /></Field>
        <Field label={v.kind === "learner" ? "College or organisation" : "Company"}><input className={input} value={v.company} onChange={t("company")} /></Field>
      </div>
      {v.kind === "learner" && (
        <>
          <Field label="Program or workshop attended" hint="e.g. TEP, AI / ML Engineering"><input className={input} value={v.program} onChange={t("program")} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="LinkedIn profile"><input className={input} type="url" value={v.linkedin} onChange={t("linkedin")} placeholder="https://www.linkedin.com/in/…" /></Field>
            <Field label="Video testimonial link"><input className={input} type="url" value={v.videoUrl} onChange={t("videoUrl")} placeholder="https://…" /></Field>
          </div>
          <ImageField slot={slot} label="Photo" />
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.featured} onChange={(e) => setV((p) => ({ ...p, featured: e.target.checked }))} /> Featured (shown large at the top)</label>
        </>
      )}
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.published} onChange={(e) => setV((p) => ({ ...p, published: e.target.checked }))} /> Published. Only publish words, names and photos you have permission to use.</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save testimonial"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}

/** Shared list tab for content that is ordered, can be hidden, and may own an image: testimonials, achievements and projects. */
function ManagedTab<T extends { published: boolean; order?: number; imageId?: string }>({ path, intro, addLabel, emptyText, label, sub, Form, startNew }: {
  startNew?: boolean;
  path: string; intro: string; addLabel: string; emptyText: string; label: (r: WithId<T>) => string; sub: (r: WithId<T>) => string;
  Form: (p: { initial?: WithId<T>; all: WithId<T>[]; onDone: () => void }) => ReactNode;
}) {
  const { rows, error } = useList<T>(path, true);
  const [editing, setEditing] = useState<WithId<T> | "new" | null>(startNew ? "new" : null);
  const [q, setQ] = useState("");
  const all = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [rows]);
  const move = async (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= all.length) return; const order = all.map((x) => x.id); [order[i], order[j]] = [order[j], order[i]]; const u: Record<string, number> = {}; order.forEach((id, k) => { u[`${path}/${id}/order`] = k; }); await update(ref(database()), u); };
  const toggle = async (r: WithId<T>) => { try { await update(ref(database()), { [`${path}/${r.id}/published`]: !r.published, [`${path}/${r.id}/updatedAt`]: serverTimestamp() }); notify(r.published ? "Hidden. It no longer shows on the site." : "Published. It now shows on the site."); } catch (e) { notify(errText(e), "error"); } };
  const del = async (r: WithId<T>) => { if (!(await askConfirm({ title: `Delete "${label(r)}"?`, body: "This cannot be undone.", confirmLabel: "Delete" }))) return; try { await remove(ref(database(), `${path}/${r.id}`)); if (r.imageId) await remove(ref(database(), `images/${r.imageId}`)).catch(() => {}); notify("Deleted."); } catch (e) { notify(errText(e), "error"); } };
  const shown = q.trim() ? all.filter((r) => `${label(r)} ${sub(r)}`.toLowerCase().includes(q.trim().toLowerCase())) : all;
  if (editing) return <>{Form({ initial: editing === "new" ? undefined : editing, all, onDone: () => setEditing(null) })}</>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><p className="text-muted">{intro}</p><button className={btnPrimary} onClick={() => setEditing("new")}>{addLabel}</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {rows === null && !error && <ListSkeleton />}
      {rows && rows.length === 0 && <div className="rounded-xl border border-dashed border-line-strong p-8 text-center"><p className="mx-auto max-w-md text-muted">{emptyText}</p><button className={`${btnPrimary} mt-4`} onClick={() => setEditing("new")}>{addLabel}</button></div>}
      {all.length > 5 && <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or text" aria-label="Search this list" className={`${input} !mt-0 max-w-sm`} />}
      {q.trim() && shown.length === 0 && <p className="text-muted">Nothing matches “{q}”.</p>}
      <ul className="divide-y divide-line rounded-xl border border-line">
        {shown.map((r) => { const i = all.indexOf(r); return (
          <li key={r.id} className="flex flex-wrap items-center gap-4 p-4">
            {r.imageId ? <img src={imageSrc(r.imageId)} alt="" className="size-12 rounded-md object-cover" /> : null}
            <div className="mr-auto min-w-0"><p className="font-semibold">{label(r)}<span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${r.published ? "border-brand-text text-brand-text" : "border-line-strong text-muted"}`}>{r.published ? "Published" : "Hidden"}</span></p><p className="truncate text-sm text-muted">{sub(r)}</p></div>
            <button className={btnGhost} onClick={() => void move(i, -1)} disabled={i === 0} aria-label={`Move ${label(r)} up`}>↑</button>
            <button className={btnGhost} onClick={() => void move(i, 1)} disabled={i === all.length - 1} aria-label={`Move ${label(r)} down`}>↓</button>
            <button className={btnGhost} onClick={() => void toggle(r)}>{r.published ? "Hide" : "Publish"}</button>
            <button className={btnGhost} onClick={() => setEditing(r)}>Edit</button><button className={btnDanger} onClick={() => void del(r)}>Delete</button>
          </li>); })}
      </ul>
    </div>
  );
}

const TestimonialsTab = ({ startNew }: TabProps) => <ManagedTab<DbTestimonial> startNew={startNew} path="testimonials" intro="Client voices appear on the Services page, learner voices on the TEP page. With none published, those sections are hidden." addLabel="Add testimonial" emptyText="No testimonials yet."
  label={(t) => t.name} sub={(t) => `${t.kind === "learner" ? "Learner · TEP page" : "Client · Services page"} · ${t.quote}`} Form={(p) => <TestimonialForm key={p.initial?.id ?? "new"} {...p} />} />;

/* ---------- achievements ---------- */
const ACH_LABEL: Record<AchievementLabel, string> = { placed: "Placed", internship: "Internship", certified: "Certified", progress: "Career progress" };
function AchievementForm({ initial, all, onDone }: { initial?: WithId<DbAchievement>; all: WithId<DbAchievement>[]; onDone: () => void }) {
  const slot = useImageSlot(initial?.imageId);
  const [v, setV] = useState({ name: initial?.name ?? "", title: initial?.title ?? "", org: initial?.org ?? "", label: (initial?.label ?? "progress") as AchievementLabel, track: initial?.track ?? "", date: initial?.date ?? "", linkedin: initial?.linkedin ?? "", story: initial?.story ?? "", published: initial?.published ?? false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const t = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.name.trim() || !v.title.trim()) return setErr("The learner’s name and the achievement are required.");
    if (v.linkedin.trim() && !isUrl(v.linkedin.trim())) return setErr("The link must start with http:// or https://");
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "achievements")).key!;
      const rec: DbAchievement = { name: v.name.trim(), title: v.title.trim(), label: v.label, published: v.published, order: initial?.order ?? all.length, updatedAt: Date.now(),
        ...(v.org.trim() ? { org: v.org.trim() } : {}), ...(v.track ? { track: v.track } : {}), ...(v.date.trim() ? { date: v.date.trim() } : {}), ...(v.linkedin.trim() ? { linkedin: v.linkedin.trim() } : {}), ...(v.story.trim() ? { story: v.story.trim() } : {}), ...(slot.id ? { imageId: slot.id } : {}) };
      await set(ref(database(), `achievements/${id}`), rec); await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit achievement" : "Add achievement"}</h3>
      <p className="text-sm text-muted">Add only what the learner has agreed to share and what a public link (such as their LinkedIn post) can verify. Never imply a company is a hiring partner or that TEP caused the outcome.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Learner name *"><input className={input} value={v.name} onChange={t("name")} required /></Field>
        <Field label="Type *"><select className={input} value={v.label} onChange={(e) => setV((p) => ({ ...p, label: e.target.value as AchievementLabel }))}>{(Object.keys(ACH_LABEL) as AchievementLabel[]).map((k) => <option key={k} value={k}>{ACH_LABEL[k]}</option>)}</select></Field>
        <Field label="Job title or achievement *"><input className={input} value={v.title} onChange={t("title")} required /></Field>
        <Field label="Organisation"><input className={input} value={v.org} onChange={t("org")} /></Field>
        <Field label="Related track"><select className={input} value={v.track} onChange={t("track")}><option value="">Not specified</option><option value="ai-ml">AI / ML Engineering</option><option value="multi-cloud">Multi-Cloud Engineering</option></select></Field>
        <Field label="Date" hint="e.g. October 2026"><input className={input} value={v.date} onChange={t("date")} /></Field>
      </div>
      <Field label="LinkedIn announcement or verification link"><input className={input} type="url" value={v.linkedin} onChange={t("linkedin")} placeholder="https://…" /></Field>
      <Field label="Their story (optional)" hint="Their own words or a short factual summary."><textarea className={input} rows={4} value={v.story} onChange={t("story")} /></Field>
      <ImageField slot={slot} label="Photo (with permission)" />
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.published} onChange={(e) => setV((p) => ({ ...p, published: e.target.checked }))} /> Published (shown on the TEP page). Untick to keep as a draft.</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save achievement"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}
const AchievementsTab = ({ startNew }: TabProps) => <ManagedTab<DbAchievement> startNew={startNew} path="achievements" intro="Verified learner milestones for the TEP page. With none published, the section is hidden. Publish only with each learner’s permission." addLabel="Add achievement" emptyText="No achievements yet."
  label={(a) => a.name} sub={(a) => `${ACH_LABEL[a.label]} · ${a.title}${a.org ? ` · ${a.org}` : ""}`} Form={(p) => <AchievementForm key={p.initial?.id ?? "new"} {...p} />} />;

/* ---------- projects ---------- */
const lines2 = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
function ProjectForm({ initial, all, onDone }: { initial?: WithId<DbProject>; all: WithId<DbProject>[]; onDone: () => void }) {
  const slot = useImageSlot(initial?.imageId);
  const [v, setV] = useState({ title: initial?.title ?? "", kind: (initial?.kind ?? "capstone") as DbProject["kind"], track: initial?.track ?? "", problem: initial?.problem ?? "", description: initial?.description ?? "", contributors: initial?.contributors ?? "",
    stack: (initial?.stack ?? []).join(", "), deliverables: (initial?.deliverables ?? []).join("\n"), repo: initial?.repo ?? "", demo: initial?.demo ?? "", feedback: initial?.feedback ?? "", published: initial?.published ?? false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const t = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.title.trim() || !v.description.trim()) return setErr("The title and the description are required.");
    for (const [label, url] of [["GitHub", v.repo], ["Live demo", v.demo]] as const) if (url.trim() && !isUrl(url.trim())) return setErr(`The ${label} link must start with http:// or https://`);
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "projects")).key!;
      const stack = v.stack.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 14), deliverables = lines2(v.deliverables);
      const rec: DbProject = { title: v.title.trim(), kind: v.kind, description: v.description.trim(), published: v.published, order: initial?.order ?? all.length, updatedAt: Date.now(),
        ...(v.track ? { track: v.track } : {}), ...(v.problem.trim() ? { problem: v.problem.trim() } : {}), ...(v.contributors.trim() ? { contributors: v.contributors.trim() } : {}), ...(stack.length ? { stack } : {}), ...(deliverables.length ? { deliverables } : {}),
        ...(v.repo.trim() ? { repo: v.repo.trim() } : {}), ...(v.demo.trim() ? { demo: v.demo.trim() } : {}), ...(v.feedback.trim() ? { feedback: v.feedback.trim() } : {}), ...(slot.id ? { imageId: slot.id } : {}) };
      await set(ref(database(), `projects/${id}`), rec); await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit project" : "Add project"}</h3>
      <p className="text-sm text-muted">List only projects that have actually been built. Learner projects need the learners’ permission.</p>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Type *"><select className={input} value={v.kind} onChange={(e) => setV((p) => ({ ...p, kind: e.target.value as DbProject["kind"] }))}><option value="capstone">Capstone (What you’ll build)</option><option value="learner">Learner project (Built by our learners)</option></select></Field>
        <Field label="Track"><select className={input} value={v.track} onChange={t("track")}><option value="">Not specified</option><option value="ai-ml">AI / ML Engineering</option><option value="multi-cloud">Multi-Cloud Engineering</option></select></Field>
        <Field label="Contributors"><input className={input} value={v.contributors} onChange={t("contributors")} placeholder="Names, comma separated" /></Field>
      </div>
      <Field label="Title *"><input className={input} value={v.title} onChange={t("title")} required /></Field>
      <Field label="Problem being solved"><textarea className={input} rows={2} value={v.problem} onChange={t("problem")} /></Field>
      <Field label="Description *"><textarea className={input} rows={4} value={v.description} onChange={t("description")} required /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Technology stack" hint="Comma separated."><input className={input} value={v.stack} onChange={t("stack")} /></Field>
        <Field label="Deliverables" hint="One per line."><textarea className={input} rows={3} value={v.deliverables} onChange={t("deliverables")} /></Field>
        <Field label="GitHub repository"><input className={input} type="url" value={v.repo} onChange={t("repo")} placeholder="https://github.com/…" /></Field>
        <Field label="Live demo"><input className={input} type="url" value={v.demo} onChange={t("demo")} placeholder="https://…" /></Field>
      </div>
      <Field label="Mentor or evaluator feedback (optional)"><textarea className={input} rows={2} value={v.feedback} onChange={t("feedback")} /></Field>
      <ImageField slot={slot} label="Screenshot or architecture diagram" />
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.published} onChange={(e) => setV((p) => ({ ...p, published: e.target.checked }))} /> Published (shown on the TEP page). Untick to keep as a draft.</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save project"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}
const ProjectsTab = ({ startNew }: TabProps) => <ManagedTab<DbProject> startNew={startNew} path="projects" intro="Capstones and learner projects for the TEP page. Each section is hidden until it has a published project." addLabel="Add project" emptyText="No projects yet."
  label={(p) => p.title} sub={(p) => `${p.kind === "capstone" ? "Capstone" : "Learner project"}${p.contributors ? ` · ${p.contributors}` : ""}`} Form={(p) => <ProjectForm key={p.initial?.id ?? "new"} {...p} />} />;

/* ---------- mentors ---------- */
/** Suggestions for the mentor pickers. They come from the program's own tools and modules, plus common extras; anything else can be typed in. */
const EXPERTISE_OPTIONS = [...new Set([...Object.values(TOOLKIT).flat(), ...Object.values(JOURNEY).flat().flatMap((s) => s.tools ?? []), "Machine learning", "Deep learning", "MLOps", "Data engineering", "DevOps", "Cloud security", "Git", "GitHub Actions", "Jenkins", "Networking", "Shell scripting", "Prompt engineering", "Software architecture", "System design", "Web development", "Cybersecurity"])].sort((a, b) => a.localeCompare(b));
const MODULE_OPTIONS = [...new Set([...Object.values(JOURNEY).flat().map((s) => s.step), "Project reviews", "Mock interviews", "Resume reviews", "Mentoring"])];
function MentorForm({ initial, all, onDone }: { initial?: WithId<DbMentor>; all: WithId<DbMentor>[]; onDone: () => void }) {
  const slot = useImageSlot(initial?.imageId);
  const [v, setV] = useState({ name: initial?.name ?? "", title: initial?.title ?? "", company: initial?.company ?? "", linkedin: initial?.linkedin ?? "", expertise: initial?.expertise ?? ([] as string[]), guides: initial?.guides ?? ([] as string[]), published: initial?.published ?? true });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const t = (k: "name" | "title" | "company" | "linkedin") => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.name.trim() || !v.title.trim()) return setErr("Name and role are required.");
    if (v.linkedin.trim() && !isUrl(v.linkedin.trim())) return setErr("The LinkedIn link must start with http:// or https://");
    if (!slot.id) return setErr("Add a photo.");
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "mentors")).key!;
      const ex = v.expertise, gu = v.guides;
      const rec: DbMentor = { name: v.name.trim(), title: v.title.trim(), imageId: slot.id, published: v.published, order: initial?.order ?? all.length, updatedAt: Date.now(),
        ...(v.company.trim() ? { company: v.company.trim() } : {}), ...(v.linkedin.trim() ? { linkedin: v.linkedin.trim() } : {}), ...(ex.length ? { expertise: ex } : {}), ...(gu.length ? { guides: gu } : {}) };
      await set(ref(database(), `mentors/${id}`), rec); await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit mentor" : "Add mentor"}</h3>
      <p className="text-sm text-muted">Only people who actually mentor on the program. Do not add qualifications or past employers you cannot verify.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name *"><input className={input} value={v.name} onChange={t("name")} required /></Field>
        <Field label="Role *"><input className={input} value={v.title} onChange={t("title")} placeholder="e.g. DevOps Engineer" required /></Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company or organisation" hint="Where they work now. Leave empty if it is DeboisTech."><input className={input} value={v.company} onChange={t("company")} placeholder="e.g. ESDS Software Solution" maxLength={80} /></Field>
        <Field label="LinkedIn profile"><input className={input} type="url" value={v.linkedin} onChange={t("linkedin")} placeholder="https://www.linkedin.com/in/…" /></Field>
      </div>
      <ChipPicker label="Technical expertise" hint="Pick from the list or type your own." value={v.expertise} onChange={(x) => setV((p) => ({ ...p, expertise: x }))} suggestions={EXPERTISE_OPTIONS} placeholder="Or type your own, e.g. Go" />
      <ChipPicker label="Modules or areas they guide" hint="Pick from the program’s modules or type your own." value={v.guides} onChange={(x) => setV((p) => ({ ...p, guides: x }))} suggestions={MODULE_OPTIONS} placeholder="Or type your own" />
      <ImageField slot={slot} label="Photo *" />
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.published} onChange={(e) => setV((p) => ({ ...p, published: e.target.checked }))} /> Published (shown on the TEP page)</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save mentor"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}
const MentorsTab = ({ startNew }: TabProps) => <ManagedTab<DbMentor> startNew={startNew} path="mentors" intro="Mentors shown on the TEP page, in this order. With none published, the section is hidden." addLabel="Add mentor" emptyText="No mentors yet."
  label={(m) => m.name} sub={(m) => `${m.title}${m.company ? ` · ${m.company}` : ""}${m.guides?.length ? ` · guides ${m.guides.join(", ")}` : ""}`} Form={(p) => <MentorForm key={p.initial?.id ?? "new"} {...p} />} />;

/* ---------- community gallery ---------- */
function CommunityPhotoForm({ initial, all, onDone }: { initial?: WithId<DbCommunityPhoto>; all: WithId<DbCommunityPhoto>[]; onDone: () => void }) {
  const slot = useImageSlot(initial?.imageId);
  const [v, setV] = useState({ label: initial?.label ?? "", caption: initial?.caption ?? "", alt: initial?.alt ?? "", position: initial?.position ?? "", published: initial?.published ?? true });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const t = (k: "label" | "caption" | "alt" | "position") => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!slot.id) return setErr("Add a photo.");
    if (!v.label.trim()) return setErr("Add the event or community name.");
    if (!v.alt.trim()) return setErr("Describe what the photo shows. People who cannot see it rely on this.");
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "community")).key!;
      const rec: DbCommunityPhoto = { label: v.label.trim(), alt: v.alt.trim(), imageId: slot.id, published: v.published, order: initial?.order ?? all.length, updatedAt: Date.now(), ...(v.caption.trim() ? { caption: v.caption.trim() } : {}), ...(v.position ? { position: v.position } : {}) };
      await set(ref(database(), `community/${id}`), rec); await slot.commit(); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit community photo" : "Add community photo"}</h3>
      <p className="text-sm text-muted">Real photos from events and communities only, with the permission of the people in them. Never stock or generated images.</p>
      <ImageField slot={slot} label="Photo *" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Event or community *" hint="Shown on the photo, e.g. DevFest Nashik 2026."><input className={input} value={v.label} onChange={t("label")} maxLength={60} required /></Field>
        <Field label="Caption" hint="Optional second line, e.g. Speaker session."><input className={input} value={v.caption} onChange={t("caption")} maxLength={90} /></Field>
      </div>
      <Field label="When the photo is cropped, keep" hint="Tiles are wide, so tall photos lose their top or bottom. Pick the part that matters."><select className={input} value={v.position} onChange={t("position")}><option value="">The middle</option><option value="50% 15%">The top (faces, stage)</option><option value="50% 85%">The bottom</option></select></Field>
      <Field label="Describe the photo *" hint="For screen readers, e.g. Students at long tables building with laptops during a workshop."><textarea className={input} rows={2} value={v.alt} onChange={t("alt")} maxLength={240} required /></Field>
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.published} onChange={(e) => setV((p) => ({ ...p, published: e.target.checked }))} /> Published (shown in the Community gallery on the Company page)</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save photo"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}
const CommunityTab = ({ startNew }: TabProps) => <ManagedTab<DbCommunityPhoto> startNew={startNew} path="community" intro="Photos for the Community gallery on the Company page, in this order (the first is shown largest). With none published, the built-in list is used." addLabel="Add photo" emptyText="No community photos yet. Add the first one."
  label={(p) => p.label} sub={(p) => p.caption || p.alt} Form={(p) => <CommunityPhotoForm key={p.initial?.id ?? "new"} {...p} />} />;

/* ---------- learner journeys ---------- */
function JourneyForm({ initial, all, onDone }: { initial?: WithId<DbJourney>; all: WithId<DbJourney>[]; onDone: () => void }) {
  const [v, setV] = useState({ before: initial?.before ?? "", after: initial?.after ?? "", who: initial?.who ?? "", track: initial?.track ?? "", published: initial?.published ?? false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const t = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.before.trim() || !v.after.trim()) return setErr("Both “where they started” and “what they built” are required.");
    setBusy(true);
    try {
      const id = initial?.id ?? push(ref(database(), "journeys")).key!;
      const rec: DbJourney = { before: v.before.trim(), after: v.after.trim(), published: v.published, order: initial?.order ?? all.length, updatedAt: Date.now(), ...(v.who.trim() ? { who: v.who.trim() } : {}), ...(v.track ? { track: v.track } : {}) };
      await set(ref(database(), `journeys/${id}`), rec); notify("Saved."); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit journey" : "Add journey"}</h3>
      <p className="text-sm text-muted">A real learner’s progress, shared with their permission. Not a promise of results for everyone.</p>
      <Field label="Where they started *" hint="e.g. Basic Python knowledge"><input className={input} value={v.before} onChange={t("before")} required /></Field>
      <Field label="What they built or became *" hint="e.g. Built and deployed an AI application"><input className={input} value={v.after} onChange={t("after")} required /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Learner (optional)" hint="Name or first name, with permission."><input className={input} value={v.who} onChange={t("who")} /></Field>
        <Field label="Track"><select className={input} value={v.track} onChange={t("track")}><option value="">Not specified</option><option value="AI / ML Engineering">AI / ML Engineering</option><option value="Multi-Cloud Engineering">Multi-Cloud Engineering</option></select></Field>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.published} onChange={(e) => setV((p) => ({ ...p, published: e.target.checked }))} /> Published (shown on the TEP page). Untick to keep as a draft.</label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex gap-3 rounded-b-xl border-t border-line bg-paper/95 px-5 py-3 backdrop-blur"><button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save journey"}</button><button type="button" className={btnGhost} onClick={onDone}>Cancel</button></div>
    </form>
  );
}
const JourneysTab = ({ startNew }: TabProps) => <ManagedTab<DbJourney> startNew={startNew} path="journeys" intro="Before-and-after learner stories for “Progress you can see” on the TEP page. Hidden until one is published."  addLabel="Add journey" emptyText="No journeys yet."
  label={(j) => j.who || j.after} sub={(j) => `${j.before} → ${j.after}`} Form={(p) => <JourneyForm key={p.initial?.id ?? "new"} {...p} />} />;

/* ---------- TEP page switches ---------- */
const TEP_SECTIONS: { key: TepSectionKey; label: string; heading: string; tab: string }[] = [
  { key: "capstones", label: "Capstones", heading: "What you’ll build matters more than what you watch.", tab: "Projects (type Capstone)" },
  { key: "mentors", label: "Mentors", heading: "Meet the mentors.", tab: "Mentors" },
  { key: "voices", label: "Learner testimonials on the TEP page", heading: "Don’t just take our word for it.", tab: "Testimonials (Shown on: TEP page)" },
  { key: "programVoices", label: "Learner testimonials on the Program page", heading: "Don’t just take our word for it.", tab: "Testimonials (Shown on: TEP page)" },
  { key: "career", label: "Career progress", heading: "Career progress & opportunities.", tab: "Achievements" },
  { key: "learnerProjects", label: "Learner projects", heading: "Built by our learners.", tab: "Projects (type Learner project)" },
  { key: "progress", label: "Learner journeys", heading: "Progress you can see.", tab: "Journeys" },
];
function TepPageTab() {
  const [on, setOn] = useState<DbTepSections | null>(null);
  const [error, setError] = useState("");
  useEffect(() => onValue(ref(database(), "settings/tep"), (s) => { setOn((s.val() ?? {}) as DbTepSections); setError(""); }, (e) => setError(errText(e))), []);
  const projects = useList<DbProject>("projects", true).rows, mentors = useList<DbMentor>("mentors", true).rows, voices = useList<DbTestimonial>("testimonials", true).rows,
    ach = useList<DbAchievement>("achievements", true).rows, journeys = useList<DbJourney>("journeys", true).rows;
  const count = (k: TepSectionKey) => {
    const pub = <T extends { published: boolean }>(r: WithId<T>[] | null, f: (x: WithId<T>) => boolean = () => true) => (r ?? []).filter((x) => x.published && f(x)).length;
    return k === "capstones" ? pub(projects, (p) => p.kind === "capstone") : k === "learnerProjects" ? pub(projects, (p) => p.kind === "learner") : k === "mentors" ? pub(mentors)
      : (k === "voices" || k === "programVoices") ? pub(voices, (t) => t.kind === "learner") : k === "career" ? pub(ach) : pub(journeys);
  };
  const flip = async (k: TepSectionKey, v: boolean) => { try { await set(ref(database(), `settings/tep/${k}`), v); } catch (e) { setError(errText(e)); } };
  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-muted">Choose which optional sections appear on the TEP page. Each one is off until you switch it on, and a section also needs at least one published entry before visitors see it. The page can take up to a minute to update.</p>
      {error && <p role="alert" className="text-error">{error}</p>}
      {on === null && !error && <p className="text-muted">Loading…</p>}
      {on && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {TEP_SECTIONS.map((s) => {
            const checked = on[s.key] === true, n = count(s.key);
            return (
              <li key={s.key} className="flex flex-wrap items-center gap-4 p-4">
                <div className="mr-auto min-w-0">
                  <p className="font-semibold">{s.label}<span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${checked ? "border-brand-text text-brand-text" : "border-line-strong text-muted"}`}>{checked ? "On" : "Off"}</span></p>
                  <p className="text-sm text-muted">“{s.heading}”</p>
                  <p className="text-sm text-muted">{n} published {n === 1 ? "entry" : "entries"} in {s.tab}{checked && n === 0 ? ". Nothing shows on the live site until you publish one." : "."}</p>
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" role="switch" className="size-5 accent-[var(--brand)]" checked={checked} onChange={(e) => void flip(s.key, e.target.checked)} />Show on the TEP page</label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- setup ---------- */
function SetupTab({ user }: { user: User }) {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<string>) => { setBusy(true); setMsg(""); try { setMsg(await fn()); } catch (e) { setMsg(errText(e)); } finally { setBusy(false); } };
  const importTeam = () => run(async () => {
    if ((await get(ref(database(), "team"))).exists()) return "The team already has entries, so nothing was imported.";
    let n = 0;
    for (const m of TEAM) {
      const blob = await (await fetch(m.photo)).blob();
      const img = await prepareImage(new File([blob], m.photo.split("/").pop() ?? "photo", { type: blob.type }));
      const key = push(ref(database(), "images")).key!;
      await set(ref(database(), `images/${key}`), { mime: img.mime, name: img.name, size: img.size, full: img.full, thumb: img.thumb, createdAt: serverTimestamp() });
      await set(ref(database(), `team/${push(ref(database(), "team")).key}`), { name: m.name, title: m.title, imageId: key, order: n, ...(m.linkedin ? { linkedin: m.linkedin } : {}) }); n++;
    }
    return `Imported ${n} team members with their photos.`;
  });
  const importTep = () => run(async () => {
    const snap = await get(ref(database(), "programs"));
    if (Object.values((snap.val() ?? {}) as Record<string, DbProgram>).some((p) => p.flagship)) return "A flagship program already exists, so nothing was imported.";
    await set(ref(database(), `programs/${push(ref(database(), "programs")).key}`), { title: "Technology Excellence Program", status: "current", flagship: true, summary: TEP_INTRO, order: 0, updatedAt: Date.now() } satisfies DbProgram);
    return "Imported the Technology Excellence Program as the flagship program. Add its dates, fee and link in the Programs tab.";
  });
  return (
    <div className="max-w-3xl space-y-8">
      <section><h3 className="text-lg font-bold">Import current content</h3>
        <p className="mt-1 text-muted">The website shows its built-in team and program until you add your own here. These one-time imports copy what is on the site into the database so you can edit it.</p>
        <div className="mt-4 flex flex-wrap gap-3"><button className={btnGhost} disabled={busy} onClick={() => void importTeam()}>Import current team and photos</button><button className={btnGhost} disabled={busy} onClick={() => void importTep()}>Import Technology Excellence Program</button></div>
        {busy && <p role="status" className="mt-3 text-muted">Working…</p>}{msg && <p role="status" className="mt-3">{msg}</p>}</section>
      <section><h3 className="text-lg font-bold">Your sign-in</h3><p className="mt-1 text-muted">Signed in as <span className="font-semibold text-ink">{user.email}</span>. Your user ID is <code className="rounded bg-wash px-2 py-1 text-ink">{user.uid}</code>.</p></section>
      <section><h3 className="text-lg font-bold">One-time Firebase setup</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted">
          <li>Firebase console → Authentication → enable <em>Email/Password</em> and add your admin user.</li>
          <li>Realtime Database → Rules → paste the contents of <code>database.rules.json</code> and publish. Until then the database is open to anyone.</li>
          <li>Realtime Database → Data → add <code>admins / {user.uid} = true</code>. Only listed users can change content.</li>
        </ol></section>
    </div>
  );
}

/* ---------- overview ---------- */
const ADD_LABEL: Record<string, string> = { programs: "Add a program", team: "Add a person", blog: "Write a post", careers: "Add a role", community: "Add a photo", testimonials: "Add a testimonial", mentors: "Add a mentor", achievements: "Add an achievement", projects: "Add a project", journeys: "Add a journey" };

function Overview({ counts, onOpen }: { counts: Record<string, number | undefined>; onOpen: (id: string, add?: boolean) => void }) {
  const loaded = SECTIONS.filter((x) => x.path).every((x) => counts[x.id] !== undefined);
  const empty = loaded && SECTIONS.filter((x) => x.path).every((x) => !counts[x.id]);
  return (
    <div className="space-y-8">
      {empty && (
        <div className="rounded-xl border border-brand-text bg-wash p-5">
          <p className="font-semibold">Nothing has been added yet.</p>
          <p className="mt-1 text-muted">Start with Setup to import the team and the Technology Excellence Program, then add photos and stories.</p>
          <button className={`${btnPrimary} mt-4`} onClick={() => onOpen("setup")}>Go to Setup</button>
        </div>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.filter((x) => x.path).map((x) => {
          const n = counts[x.id];
          return (
            <li key={x.id} className="flex flex-col rounded-xl border border-line bg-wash p-5">
              <div className="flex items-baseline justify-between gap-3"><h2 className="text-lg font-bold">{x.label}</h2><p className="text-sm text-muted">{n === undefined ? "…" : n === 0 ? "None yet" : `${n} ${n === 1 ? "item" : "items"}`}</p></div>
              <p className="mt-1 flex-1 text-sm text-muted">{x.blurb}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={btnPrimary} onClick={() => onOpen(x.id, true)}>{ADD_LABEL[x.id]}</button>
                <button className={btnGhost} onClick={() => onOpen(x.id)}>Manage</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** How many items each section holds, for the menu badges and the overview. */
function useCounts(enabled: boolean) {
  const [c, setC] = useState<Record<string, number | undefined>>({});
  useEffect(() => {
    if (!enabled) return;
    const offs = SECTIONS.filter((x) => x.path).map((x) => onValue(ref(database(), x.path!), (snap) => setC((p) => ({ ...p, [x.id]: snap.size })), () => {}));
    return () => offs.forEach((off) => off());
  }, [enabled]);
  return c;
}

const sectionFromHash = () => { const h = typeof window === "undefined" ? "" : window.location.hash.slice(1); return ALL_SECTIONS.some((x) => x.id === h) ? h : "overview"; };

export function DashboardApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminErr, setAdminErr] = useState("");
  const [tab, setTab] = useState(sectionFromHash); // the address bar remembers where you are, so a refresh or a shared link lands on the same section
  const [startNew, setStartNew] = useState(false);
  const counts = useCounts(isAdmin === true);
  useEffect(() => { const on = () => setTab(sectionFromHash()); window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);
  const open = (id: string, add = false) => { setStartNew(add); setTab(id); window.history.replaceState(null, "", `#${id}`); };

  useEffect(() => onAuthStateChanged(auth(), (u) => { setUser(u); setIsAdmin(null); setAdminErr(""); }), []);
  useEffect(() => {
    if (!user) return;
    let live = true;
    get(ref(database(), `admins/${user.uid}`)).then((s) => { if (live) setIsAdmin(s.val() === true); }).catch((e) => { if (live) { setIsAdmin(false); setAdminErr(errText(e)); } });
    return () => { live = false; };
  }, [user]);

  if (user === undefined) return <p className="p-8 text-muted" role="status">Loading…</p>;
  if (!user) return <SignIn />;
  if (isAdmin === null) return <p className="p-8 text-muted" role="status">Checking access…</p>;
  if (!isAdmin) return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-16">
      <h1 className="display text-4xl">No access yet</h1>
      <p className="text-muted">You are signed in as {user.email}, but this account is not an administrator.</p>
      <p className="text-muted">In the Firebase console, open Realtime Database → Data and add <code className="rounded bg-wash px-2 py-1 text-ink">admins / {user.uid} = true</code>. Then reload this page.</p>
      {adminErr && <p role="alert" className="text-error">{adminErr}</p>}
      <button className={btnGhost} onClick={() => void signOut(auth())}>Sign out</button>
    </div>
  );
  return (
    <Shell email={user.email ?? ""} onSignOut={() => void signOut(auth())} current={tab} onPick={(id) => open(id)} counts={counts}>
      {tab === "overview" && <Overview counts={counts} onOpen={open} />}
      {tab === "programs" && <ProgramsTab startNew={startNew} />}{tab === "team" && <TeamTab startNew={startNew} />}{tab === "blog" && <BlogTab startNew={startNew} />}{tab === "careers" && <CareersTab startNew={startNew} />}
      {tab === "community" && <CommunityTab startNew={startNew} />}{tab === "testimonials" && <TestimonialsTab startNew={startNew} />}{tab === "mentors" && <MentorsTab startNew={startNew} />}{tab === "achievements" && <AchievementsTab startNew={startNew} />}{tab === "projects" && <ProjectsTab startNew={startNew} />}{tab === "journeys" && <JourneysTab startNew={startNew} />}
      {tab === "tep" && <TepPageTab />}
      {tab === "setup" && <SetupTab user={user} />}
    </Shell>
  );
}

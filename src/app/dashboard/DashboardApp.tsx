"use client";
/* eslint-disable @next/next/no-img-element -- thumbnails come from the database via /api/img or local blob previews */
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { get, onValue, push, ref, remove, serverTimestamp, set, update } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { base64ToObjectUrl, imageSrc, prepareImage } from "@/lib/images";
import type { DbOpening, DbPost, DbProgram, DbTeam, ProgramStatus, WithId } from "@/content/dynamic";
import { TEAM } from "@/content/team";
import { TEP_INTRO } from "@/content/tep";

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
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-4">
        {src ? <img src={src} alt="" className="size-24 rounded-md border border-line object-cover" /> : <div className="grid size-24 place-items-center rounded-md border border-dashed border-line-strong text-xs text-muted">No image</div>}
        <div className="space-y-2">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={slot.busy} aria-label={`${label}: choose a file`}
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) void slot.upload(f); e.target.value = ""; }} className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-glow file:px-4 file:py-2 file:font-semibold file:text-forest" />
          {slot.id && <button type="button" className="text-sm text-brand-text underline" onClick={slot.clear}>Remove image</button>}
          <p className="text-xs text-muted">The original file is stored exactly as uploaded (lossless). JPG, PNG, WebP, GIF or AVIF, up to 7.5 MB.</p>
        </div>
      </div>
      {slot.busy && <p role="status" className="mt-2 text-sm text-muted">Uploading…</p>}
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
    <main className="grid min-h-full place-items-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5" aria-labelledby="signin-h">
        <h1 id="signin-h" className="display text-4xl">Sign in</h1>
        <Field label="Email"><input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className={input} type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        {err && <p role="alert" className="text-sm text-error">{err}</p>}
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
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
      await slot.commit(); onDone();
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-line p-5">
      <h3 className="text-xl font-bold">{initial ? "Edit program" : "Add program"}</h3>
      <Field label="Title *"><input className={input} value={v.title} onChange={set_("title")} required /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status *"><select className={input} value={v.status} onChange={set_("status")}>{(Object.keys(STATUS_LABEL) as ProgramStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
        <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={!!v.flagship} onChange={(e) => setV((p) => ({ ...p, flagship: e.target.checked }))} /> Flagship program (Technology Excellence Program)</label>
      </div>
      <Field label="Summary *" hint="One or two sentences, shown on the Program page."><textarea className={input} rows={3} value={v.summary} onChange={set_("summary")} required /></Field>
      <Field label="Details" hint="Longer description. Blank line = new paragraph."><textarea className={input} rows={5} value={v.details ?? ""} onChange={set_("details")} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Start date"><input className={input} value={v.startDate ?? ""} onChange={set_("startDate")} placeholder="e.g. 9 August 2026" /></Field>
        <Field label="End date"><input className={input} value={v.endDate ?? ""} onChange={set_("endDate")} placeholder="e.g. 4 October 2026" /></Field>
        <Field label="Duration"><input className={input} value={v.duration ?? ""} onChange={set_("duration")} placeholder="e.g. 8 weeks" /></Field>
        <Field label="Fee"><input className={input} value={v.fee ?? ""} onChange={set_("fee")} placeholder="e.g. ₹15,000" /></Field>
      </div>
      <Field label="Apply / more-info link"><input className={input} type="url" value={v.applyUrl ?? ""} onChange={set_("applyUrl")} placeholder="https://…" /></Field>
      <ImageField slot={slot} label="Image" />
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="flex gap-3"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save program"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}

function ProgramsTab() {
  const { rows, error } = useList<DbProgram>("programs", true);
  const [editing, setEditing] = useState<WithId<DbProgram> | "new" | null>(null);
  const all = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [rows]);
  const groups: [string, WithId<DbProgram>[]][] = [["Flagship", all.filter((p) => p.flagship)], ["Current (ongoing)", all.filter((p) => !p.flagship && p.status === "current")], ["Upcoming", all.filter((p) => !p.flagship && p.status === "upcoming")], ["Past", all.filter((p) => !p.flagship && p.status === "past")]];
  const del = async (p: WithId<DbProgram>) => { if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return; await remove(ref(database(), `programs/${p.id}`)); if (p.imageId) await remove(ref(database(), `images/${p.imageId}`)).catch(() => {}); };
  if (editing) return <ProgramForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} all={all} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><p className="text-muted">Shown on the public Program page. Past programs stay listed as history.</p><button className={btnPrimary} onClick={() => setEditing("new")}>Add program</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {rows === null && !error && <p className="text-muted">Loading…</p>}
      {rows && rows.length === 0 && <p className="rounded-xl border border-dashed border-line-strong p-6 text-muted">No programs yet. Add one, or use “Import current content” in the Setup tab to bring in the Technology Excellence Program.</p>}
      {groups.filter(([, g]) => g.length).map(([name, g]) => (
        <section key={name}><h3 className="mb-3 text-lg font-bold">{name}</h3>
          <ul className="divide-y divide-line rounded-xl border border-line">{g.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              {p.imageId ? <img src={imageSrc(p.imageId)} alt="" className="size-14 rounded-md object-cover" /> : <div className="size-14 rounded-md border border-dashed border-line-strong" />}
              <div className="mr-auto min-w-0"><p className="font-semibold">{p.title}{p.flagship && <span className="ml-2 rounded-full border border-brand-text px-2 py-0.5 text-xs text-brand-text">Flagship</span>}</p><p className="truncate text-sm text-muted">{STATUS_LABEL[p.status]}{p.startDate ? ` · ${p.startDate}` : ""}</p></div>
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
      await set(ref(database(), `team/${id}`), rec); await slot.commit(); onDone();
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
      <div className="flex gap-3"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : "Save member"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}

function TeamTab() {
  const { rows, error } = useList<DbTeam>("team", true);
  const [editing, setEditing] = useState<WithId<DbTeam> | "new" | null>(null);
  const all = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [rows]);
  const move = async (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= all.length) return; const order = all.map((m) => m.id); [order[i], order[j]] = [order[j], order[i]]; const u: Record<string, number> = {}; order.forEach((id, k) => { u[`team/${id}/order`] = k; }); await update(ref(database()), u); };
  const del = async (m: WithId<DbTeam>) => { if (!window.confirm(`Remove ${m.name} from the team?`)) return; await remove(ref(database(), `team/${m.id}`)); if (m.imageId) await remove(ref(database(), `images/${m.imageId}`)).catch(() => {}); };
  if (editing) return <TeamForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} count={all.length} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-muted">Order here is the order on the website. Photos are stored losslessly.</p><button className={btnPrimary} onClick={() => setEditing("new")}>Add member</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {rows === null && !error && <p className="text-muted">Loading…</p>}
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
      await slot.commit(); onDone();
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
      <div className="flex gap-3"><button className={btnPrimary} disabled={busy || slot.busy}>{busy ? "Saving…" : v.publish ? "Save and publish" : "Save draft"}</button><button type="button" className={btnGhost} onClick={() => { void slot.discard(); onDone(); }}>Cancel</button></div>
    </form>
  );
}

function BlogTab() {
  const pub = useList<DbPost>("posts", true), dr = useList<DbPost>("drafts", true);
  const [editing, setEditing] = useState<PostRow | "new" | null>(null);
  const posts: PostRow[] = useMemo(() => [...(pub.rows ?? []).map((p) => ({ ...p, published: true })), ...(dr.rows ?? []).map((p) => ({ ...p, published: false }))].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)), [pub.rows, dr.rows]);
  const del = async (p: PostRow) => { if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return; await remove(ref(database(), `${p.published ? "posts" : "drafts"}/${p.id}`)); if (p.coverImageId) await remove(ref(database(), `images/${p.coverImageId}`)).catch(() => {}); };
  const error = pub.error || dr.error;
  if (editing) return <PostForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} posts={posts} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-muted">Published posts appear at /blog. Drafts are private.</p><button className={btnPrimary} onClick={() => setEditing("new")}>New post</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {pub.rows === null && !error && <p className="text-muted">Loading…</p>}
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
      await set(ref(database(), `openings/${id}`), rec); onDone();
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
      <div className="flex gap-3"><button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save role"}</button><button type="button" className={btnGhost} onClick={onDone}>Cancel</button></div>
    </form>
  );
}

function CareersTab() {
  const { rows, error } = useList<DbOpening>("openings", true);
  const [editing, setEditing] = useState<WithId<DbOpening> | "new" | null>(null);
  const all = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [rows]);
  const move = async (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= all.length) return; const order = all.map((o) => o.id); [order[i], order[j]] = [order[j], order[i]]; const u: Record<string, number> = {}; order.forEach((id, k) => { u[`openings/${id}/order`] = k; }); await update(ref(database()), u); };
  const toggle = async (o: WithId<DbOpening>) => { await update(ref(database()), { [`openings/${o.id}/open`]: !o.open, [`openings/${o.id}/updatedAt`]: serverTimestamp() }); };
  const del = async (o: WithId<DbOpening>) => { if (!window.confirm(`Delete "${o.title}"? This cannot be undone.`)) return; await remove(ref(database(), `openings/${o.id}`)); };
  if (editing) return <OpeningForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} openings={all} onDone={() => setEditing(null)} />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-muted">Open roles appear at /careers. With none open, the page invites people to get in touch.</p><button className={btnPrimary} onClick={() => setEditing("new")}>Add role</button></div>
      {error && <p role="alert" className="text-error">{error}</p>}
      {rows === null && !error && <p className="text-muted">Loading…</p>}
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

/* ---------- shell ---------- */
const TABS = ["Programs", "Team", "Blog", "Careers", "Setup"] as const;
type Tab = (typeof TABS)[number];

export function DashboardApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminErr, setAdminErr] = useState("");
  const [tab, setTab] = useState<Tab>("Programs");

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
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16">
      <h1 className="display text-4xl">No access yet</h1>
      <p className="text-muted">You are signed in as {user.email}, but this account is not an administrator.</p>
      <p className="text-muted">In the Firebase console, open Realtime Database → Data and add <code className="rounded bg-wash px-2 py-1 text-ink">admins / {user.uid} = true</code>. Then reload this page.</p>
      {adminErr && <p role="alert" className="text-error">{adminErr}</p>}
      <button className={btnGhost} onClick={() => void signOut(auth())}>Sign out</button>
    </main>
  );
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <h1 className="mr-auto text-lg font-bold">DeboisTech dashboard</h1>
          <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
          <button className={btnGhost} onClick={() => void signOut(auth())}>Sign out</button>
        </div>
        <nav aria-label="Dashboard sections" className="mx-auto max-w-5xl px-4"><div role="tablist" className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${tab === t ? "border-glow text-ink" : "border-transparent text-muted hover:text-ink"}`}>{t}</button>)}
        </div></nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8" role="tabpanel" aria-label={tab}>
        {tab === "Programs" && <ProgramsTab />}{tab === "Team" && <TeamTab />}{tab === "Blog" && <BlogTab />}{tab === "Careers" && <CareersTab />}{tab === "Setup" && <SetupTab user={user} />}
      </main>
    </div>
  );
}

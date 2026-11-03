import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = ["/", "/products", "/products/tenantplane", "/products/motoadmin", "/services", "/services/ai-ml", "/company", "/work", "/program", "/blog", "/dashboard", "/tep", "/tep/ai-ml", "/tep/multi-cloud", "/labs", "/careers", "/contact", "/privacy", "/terms", "/nope"];

for (const r of ROUTES) {
  test(`a11y + no horizontal overflow: ${r}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // settled state: no mid-fade sampling
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(r);
    // Sections use content-visibility:auto, so render everything the way a visitor scrolling would before auditing.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "horizontal overflow at 320px").toBeLessThanOrEqual(0);
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}

test("home headline exact", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Building Technology. Creating Value.");
});

test("ecosystem scene: starts collapsed, opens on click, closes on a second click", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator("section[aria-labelledby='eco']");
  const programBtn = scene.getByRole("button", { name: /Program/ });
  await expect(scene.locator("button[aria-expanded='true']")).toHaveCount(0);           // nothing is pre-expanded
  await expect(scene.getByRole("link", { name: "See the programs" })).toBeHidden();
  await programBtn.click();
  await expect(programBtn).toHaveAttribute("aria-expanded", "true");
  await expect(scene.getByRole("link", { name: "See the programs" })).toBeVisible();
  await scene.getByRole("button", { name: /Products/ }).click();                         // opening another swaps the open item
  await expect(programBtn).toHaveAttribute("aria-expanded", "false");
  await scene.getByRole("button", { name: /Products/ }).click();                         // second click closes it
  await expect(scene.locator("button[aria-expanded='true']")).toHaveCount(0);
});

test("mobile nav opens, navigates, closes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  const btn = page.getByRole("button", { name: /(Open|Close) menu/ });
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("navigation", { name: "Mobile primary" }).getByRole("link", { name: "Products" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("button", { name: /(Open|Close) menu/ })).toHaveAttribute("aria-expanded", "false");
});

test("contact form: validation, preserved input, truthful failure when unconfigured", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("alert").first()).toContainText("Please fix");
  await page.getByLabel("Name *").fill("Test User");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Message *").fill("Hello, this is a test message.");
  await page.getByLabel(/I have read the/).check();
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: "Your message was not sent" })).toBeVisible();
  await expect(page.getByText(/Thanks. Your message was sent/)).toHaveCount(0);
  await expect(page.getByLabel("Name *")).toHaveValue("Test User");
});

test("tep prefill from query", async ({ page }) => {
  await page.goto("/contact?intent=tep&track=multi-cloud");
  await expect(page.getByLabel("Which track? *")).toHaveValue("multi-cloud");
});

test("debo labs: terminal walkthrough steps to a passed check", async ({ page }) => {
  await page.goto("/labs");
  await expect(page.getByText("Nothing is executed here")).toBeVisible();
  for (const cmd of ["ls -l deploy.sh", "chmod +x deploy.sh", "./deploy.sh"]) {
    await page.getByRole("button", { name: `Run: ${cmd}` }).click();
  }
  await expect(page.getByText("✓ Check passed · deploy.sh is executable")).toBeVisible();
  await page.getByRole("button", { name: "Reset walkthrough" }).click();
  await expect(page.getByRole("button", { name: "Run: ls -l deploy.sh" })).toBeVisible();
});

test("debo labs: track links point at labs.deboistech.in", async ({ page }) => {
  await page.goto("/labs");
  const links = await page.locator('a[href^="https://labs.deboistech.in/t/"]').count();
  expect(links).toBe(11);
});

test("home product slider: three products in order, only the visible slide is reachable, learn more goes to each product page", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByRole("group", { name: "DeboisTech products" });
  await slider.scrollIntoViewIfNeeded();
  const inert = slider.locator('[aria-roledescription="slide"][inert]');
  const next = slider.getByRole("button", { name: "Next product" });
  // 1. Debo Labs (lives at /labs)
  await expect(slider.getByRole("heading", { name: "Learn DevOps by doing." })).toBeVisible();
  await expect(slider.getByRole("link", { name: "Learn more about Debo Labs" })).toHaveAttribute("href", "/labs");
  await expect(inert).toHaveCount(2); // the other slides are inert: the browser blocks focus into them
  // 2. MotoAdmin
  await next.click();
  await expect(slider.getByRole("link", { name: "Learn more about MotoAdmin" })).toHaveAttribute("href", "/products/motoadmin");
  await expect(inert.first()).toHaveAttribute("aria-label", "Debo Labs, 1 of 3");
  // 3. TenantPlane
  await next.click();
  await expect(slider.getByRole("link", { name: "Learn more about TenantPlane" })).toHaveAttribute("href", "/products/tenantplane");
  await expect(next).toBeDisabled();
  // switcher jumps back
  await slider.getByRole("group", { name: "Choose a product" }).getByRole("button", { name: "Debo Labs" }).click();
  await expect(slider.getByRole("link", { name: "Learn more about Debo Labs" })).toBeVisible();
});

test("products are ordered Debo Labs, MotoAdmin, TenantPlane everywhere they are listed", async ({ page }) => {
  const names = ["Debo Labs", "MotoAdmin", "TenantPlane"];
  // /products page order (the h2 of each product story)
  await page.goto("/products");
  const heads = await page.locator("main section h2").allTextContents();
  const idx = ["Learn DevOps by doing.", "Every licence. Every renewal. One place.", "Multi-tenancy you can explain."].map((h) => heads.indexOf(h));
  expect(idx.every((i) => i >= 0) && idx[0] < idx[1] && idx[1] < idx[2]).toBe(true);
  // footer Products column order
  const col = page.getByRole("navigation", { name: "Products" }).last().getByRole("link");
  expect((await col.allTextContents()).slice(0, 3)).toEqual(names);
  // home slider switcher order
  await page.goto("/");
  const switcher = page.getByRole("group", { name: "Choose a product" }).getByRole("button");
  expect(await switcher.allTextContents()).toEqual(names);
});

test("Debo Labs product page lives at /labs and /products/debo-labs redirects there", async ({ page }) => {
  const res = await page.goto("/products/debo-labs");
  await expect(page).toHaveURL(/\/labs$/);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learn DevOps by doing.");
});

test("footer links to Instagram", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: /Instagram/ }).first()).toHaveAttribute("href", "https://instagram.com/deboistech.in");
});

test.describe("hero skyline and cursor block", () => {
  test("the skyline canvas draws blocks and the headline stays readable", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const lit = await page.locator("canvas[data-skyline]").evaluate((c: HTMLCanvasElement) => { const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++; return n; });
    expect(lit).toBeGreaterThan(2000); // blocks are on the canvas
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Building Technology. Creating Value.");
  });

  test("a single green block follows the pointer inside the hero", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(800);
    const block = page.locator(".hero .bg-glow.size-3\\.5");
    await expect(block).toHaveCSS("opacity", "0");
    await page.mouse.move(300, 300); await page.mouse.move(700, 420, { steps: 12 }); await page.waitForTimeout(500);
    await expect(block).toHaveCSS("opacity", "1");
    const box = (await block.boundingBox())!;
    expect(Math.abs(box.x + box.width / 2 - 700)).toBeLessThan(40); // it has caught up with the pointer
    await page.mouse.move(700, 5, { steps: 4 }); // header area is outside the hero's box? keep the pointer inside: move to the CTA to see it grow
    const cta = (await page.getByRole("link", { name: "Explore Our Work" }).boundingBox())!;
    await page.mouse.move(cta.x + cta.width / 2, cta.y + cta.height / 2, { steps: 8 }); await page.waitForTimeout(600);
    const grown = (await block.boundingBox())!;
    expect(grown.width).toBeGreaterThan(30);                    // scaled up over a button
  });

  test("reduced motion: still skyline, no cursor block movement", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3100/"); await page.waitForTimeout(800);
    await page.mouse.move(600, 400, { steps: 5 }); await page.waitForTimeout(300);
    await expect(page.locator(".hero .bg-glow.size-3\\.5")).toHaveCSS("opacity", "0");
    const lit = await page.locator("canvas[data-skyline]").evaluate((c: HTMLCanvasElement) => { const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++; return n; });
    expect(lit).toBeGreaterThan(2000);
    await ctx.close();
  });
});

test("hero fits a 1366×768 laptop: headline, buttons and the skyline are on the first screen", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3100/");
  await page.waitForTimeout(1500);
  for (const loc of [page.getByRole("heading", { level: 1 }), page.getByRole("link", { name: "Explore Our Work" }), page.locator("canvas[data-skyline]")]) {
    const b = (await loc.boundingBox())!;
    expect(b.y).toBeLessThan(768 - 60);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await ctx.close();
});

test("home sections alternate black and white: the black hero and About form one block, then white, black, white; the newsletter closes the page in black, then the white footer", async ({ page }) => {
  await page.goto("/");
  const tones = await page.evaluate(() => {
    const lum = (rgb: string) => { const m = rgb.match(/\d+(\.\d+)?/g)!.map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
    const els = [...document.querySelectorAll("main > .hero, main > section"), document.querySelector("footer")!];
    return els.map((el) => {
      const l = lum(getComputedStyle(el).backgroundColor);
      return { name: el.getAttribute("aria-labelledby") ?? el.getAttribute("aria-label") ?? el.tagName.toLowerCase() + (el.className.includes("hero") ? ".hero" : ""), tone: l < 0.12 ? "black" : l > 0.9 ? "white" : `OTHER(${l.toFixed(2)})` };
    });
  });
  expect(tones.filter((t) => t.tone.startsWith("OTHER")), JSON.stringify(tones)).toEqual([]); // no grey sections
  // The hero and About are deliberately one continuous black block (no edge between them). Every other neighbour inside <main> must flip.
  expect(tones[0].tone).toBe("black");
  expect(tones[1].tone).toBe("black");
  const main = tones.slice(1, -1);
  for (let i = 1; i < main.length; i++) expect(main[i].tone, `${main[i - 1].name} → ${main[i].name}`).not.toBe(main[i - 1].tone);
  expect(main.at(-1)!.tone).toBe("black");   // the newsletter section closes the page, then a pixel edge into the white footer
  expect(main.at(-2)!.tone).toBe("white");   // TEP
  expect(tones.at(-1)!.tone).toBe("white");
});

test("header logo: the dark and light copies occupy exactly the same box (no vertical drift)", async ({ page }) => {
  await page.goto("/");
  const boxes = await page.evaluate(() => [...document.querySelectorAll("header a[href='/'] img")].map((i) => { const r = i.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10); }));
  expect(boxes).toHaveLength(2);
  expect(boxes[0]).toEqual(boxes[1]);
});

test("pixel edges never leave a seam before the next section, at fractional browser zoom", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  for (const zoom of [0.8, 0.9, 1.1, 1.25]) {
    await page.evaluate((z) => { (document.documentElement.style as unknown as { zoom: string }).zoom = String(z); }, zoom);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 800) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
    const topGaps = await page.evaluate(() => [...document.querySelectorAll("main svg[data-edge]")].map((svg) => {
      const prev = svg.parentElement!.previousElementSibling as HTMLElement | null;
      return prev ? Math.round((svg.getBoundingClientRect().top - prev.getBoundingClientRect().bottom) * 100) / 100 : null;
    }));
    for (const g of topGaps) expect(g, `zoom ${zoom}: gap between the section above and a pixel edge`).toBeLessThanOrEqual(0);
    const gaps = await page.evaluate(() => [...document.querySelectorAll("main svg[data-edge]")].map((svg) => {
      const wrap = svg.parentElement!; const next = (wrap.nextElementSibling ?? document.querySelector("footer")) as HTMLElement | null; // the last edge precedes the footer, which is outside <main>
      return next ? Math.round((next.getBoundingClientRect().top - svg.getBoundingClientRect().bottom) * 100) / 100 : null;
    }));
    expect(gaps.length).toBeGreaterThanOrEqual(5);
    for (const g of gaps) expect(g, `zoom ${zoom}: gap between a pixel edge and the next section`).toBeLessThanOrEqual(0); // 0 or overlapping, never a positive gap
  }
});

test("Company page has a community section covering GDG Nashik and CNCG Nashik, with proof links", async ({ page }) => {
  await page.goto("/company");
  const sec = page.locator("section[aria-labelledby='community']");
  await expect(sec.getByRole("heading", { level: 2, name: "We build more than software. We build ecosystems." })).toBeVisible();
  // Stories sit under the intro, or in the photo gallery's dark section once community photos exist, so look page-wide for them.
  await expect(page.getByRole("heading", { level: 3, name: "From Prompt to Prod" })).toBeVisible();
  await expect(sec.getByText("Community partner", { exact: true })).toBeVisible();                                   // GDG Nashik tile
  await expect(sec.getByText("Part of the Cloud Native & AI community", { exact: true })).toBeVisible();             // CNCG Nashik tile
  await expect(sec.getByRole("link", { name: /Partner Finder profile/ })).toHaveAttribute("href", "https://cloud.google.com/find-a-partner/partner/deboistech");
  await expect(sec.getByRole("link", { name: /GDG Nashik partners list/ })).toHaveAttribute("href", "https://gdgnashik.com/#partners");
});

test("navbar: Program replaces Academy / TEP, Debo Labs is gone, and the CTA is compact", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  expect(await nav.getByRole("link").allTextContents()).toEqual(["Home", "Products", "Services", "Program", "Company"]);
  await expect(page.getByRole("link", { name: "Let’s build together" }).first()).toBeVisible();
  const cta = (await page.locator("header a[href='/contact']").first().boundingBox())!;
  const pill = (await page.locator("header .glass-pill").boundingBox())!;
  expect(cta.height).toBeLessThanOrEqual(40);                    // sits inside the pill with clear margin
  expect(pill.height - cta.height).toBeGreaterThanOrEqual(12);
  await page.goto("/tep/ai-ml");
  await expect(nav.getByRole("link", { name: "Program" })).toHaveAttribute("aria-current", "page"); // TEP pages live under Program
  await page.goto("/program");
  await expect(page.getByRole("heading", { level: 3, name: "Technology Excellence Program" })).toBeVisible();
  await expect(page.getByRole("link", { name: "See the program" })).toHaveAttribute("href", "/tep");
});

test("team shows every member with a portrait; LinkedIn links are real, never empty", async ({ page }) => {
  await page.goto("/company");
  const team = page.locator("section[aria-labelledby='team']");
  for (const [n, t] of [["Harshad Gangurde", "Business Development Executive"], ["Atharv Borse", "Cloud Engineer"]]) {
    await expect(team.getByText(n, { exact: true })).toBeVisible();
    await expect(team.getByText(t, { exact: true })).toBeVisible();
    await expect(team.getByRole("img", { name: `Portrait of ${n}` })).toBeVisible();
  }
  // The team can be edited in the dashboard, so do not pin the exact count: at least the seven we know, and every link points somewhere.
  const portraits = await team.getByRole("img", { name: /^Portrait of / }).count();
  expect(portraits).toBeGreaterThanOrEqual(7);
  const hrefs = await team.getByRole("link", { name: /LinkedIn profile of/ }).evaluateAll((a) => a.map((x) => (x as HTMLAnchorElement).getAttribute("href")));
  expect(hrefs.length).toBeLessThanOrEqual(portraits);
  for (const h of hrefs) expect(h, "a LinkedIn link must never be empty").toMatch(/^https:\/\//);
});

test.describe("team carousel", () => {
  const scrollLeft = (page: import("@playwright/test").Page) => page.evaluate(() => document.querySelector<HTMLElement>("section[aria-labelledby='team'] [aria-roledescription='carousel'] ul")!.scrollLeft);

  test("slides on its own, holds while the pointer is over it, and loops back to the start", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/company");
    const car = page.locator("section[aria-labelledby='team'] [aria-roledescription='carousel']");
    await car.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5); // keep the pointer off the carousel
    const start = await scrollLeft(page);
    await expect.poll(() => scrollLeft(page), { timeout: 12_000 }).toBeGreaterThan(start + 100); // autoplay advanced
    const box = (await car.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);                          // pointer over it: autoplay holds
    await page.waitForTimeout(400);
    const held = await scrollLeft(page);
    await page.waitForTimeout(4000);
    expect(Math.abs((await scrollLeft(page)) - held)).toBeLessThan(4);
    let peak = await scrollLeft(page), wrapped = false;
    for (let i = 0; i < 8 && !wrapped; i++) {                                                     // keep pressing Next: at the end it must wrap to the start
      await car.getByRole("button", { name: "Next team members" }).click(); await page.waitForTimeout(700);
      const now = await scrollLeft(page);
      if (now < peak - 100) wrapped = true; else peak = Math.max(peak, now);
    }
    expect(wrapped, "Next past the last card should loop back to the first").toBe(true);
  });

  test("reduced motion: no autoplay, arrows still work", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3100/company");
    const car = page.locator("section[aria-labelledby='team'] [aria-roledescription='carousel']");
    await car.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000);
    expect(await scrollLeft(page)).toBeLessThan(4);
    await car.getByRole("button", { name: "Next team members" }).click();
    await expect.poll(() => scrollLeft(page)).toBeGreaterThan(100);
    await ctx.close();
  });
});

test("culture gallery: five real photos under the new heading, no placeholders", async ({ page }) => {
  await page.goto("/company");
  const g = page.locator("section[aria-labelledby='culture-h']");
  await expect(g.getByRole("heading", { level: 3, name: "Where we build and learn." })).toBeVisible();
  await expect(g.getByRole("img")).toHaveCount(5);
  await expect(g.getByText("Placeholder")).toHaveCount(0);
  await expect(page.getByText("Life at DeboisTech")).toHaveCount(0);
  await g.scrollIntoViewIfNeeded();                                     // images are lazy-loaded: bring them on screen first
  await expect.poll(() => g.locator("img").evaluateAll((imgs) => imgs.filter((i) => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0).length), { timeout: 15_000 }).toBe(0); // none broken
});

test.describe("dashboard privacy", () => {
  test("is not linked from any public page, and is excluded from robots and the sitemap", async ({ page, request }) => {
    for (const path of ["/", "/company", "/products", "/services", "/program", "/blog", "/contact", "/privacy"]) {
      await page.goto(path);
      expect(await page.locator("a[href*='dashboard' i]").count(), `${path} links to the dashboard`).toBe(0);
      expect((await page.content()).toLowerCase().includes("href=\"/dashboard")).toBe(false);
    }
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow:\s*\/dashboard/);
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain("dashboard");
    expect((await request.get("/dashboard")).headers()["x-robots-tag"]).toContain("noindex");
  });

  test("signed out, it shows only a sign-in form (no content, no data requests for content)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(0);                                  // no dashboard tabs before sign-in
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  });

  test("a wrong sign-in shows a generic error and stays signed out", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /incorrect|network|too many/i })).toBeVisible({ timeout: 20_000 }); // (Next also renders an empty route-announcer alert)
    await expect(page.getByRole("tab")).toHaveCount(0);
  });
});

test("blog: empty state renders, unknown posts 404, and the footer links to it", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1, name: "Notes from the team." })).toBeVisible();
  const res = await page.goto("/blog/this-post-does-not-exist");
  expect(res?.status()).toBe(404);
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Blog", exact: true }).first()).toHaveAttribute("href", "/blog");
});

test("image route rejects malformed ids and unknown images", async ({ request }) => {
  expect((await request.get("/api/img/..%2f..%2fsecret")).status()).toBe(404);
  expect((await request.get("/api/img/abc")).status()).toBe(404);          // too short to be a valid id
  expect((await request.get("/api/img/AAAAAAAAAAAAAAAAAAAA")).status()).toBe(404); // well-formed but not in the database
});

test("refreshing the home page starts at the top instead of restoring the old scroll position", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.evaluate(() => { const e = document.querySelector("#team")!; window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY); });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(600);    // we really are well down the page (anchors shift as lazy sections lay out)
  await page.reload();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(60);        // and a refresh puts us back at the top
});

test.describe("services explorer", () => {
  test("shows one service at a time, switches by click and keyboard, and links to the full page", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    const sec = page.locator("section[aria-labelledby='services']");
    await sec.scrollIntoViewIfNeeded();
    const tabs = sec.getByRole("tab");
    await expect(tabs).toHaveCount(7);
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(sec.getByRole("tabpanel").getByRole("heading", { level: 3, name: "Software Engineering" })).toBeVisible();
    await tabs.nth(5).click();
    await expect(sec.getByRole("tabpanel").getByRole("heading", { level: 3, name: "Cybersecurity" })).toBeVisible();
    await expect(sec.getByRole("link", { name: "Learn more" })).toHaveAttribute("href", "/services/cybersecurity");
    await expect(sec.getByRole("link", { name: "Discuss Cybersecurity" })).toHaveAttribute("href", "/contact?intent=project&topic=cybersecurity");
    await tabs.nth(5).focus();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(6)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");                                                   // wraps to the first
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(sec.getByRole("tabpanel").getByRole("heading", { level: 3, name: "Digital Transformation" })).toBeVisible();
  });

  test("the whole section stays compact on desktop (it used to be seven tall rows)", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    const sec = page.locator("section[aria-labelledby='services']");
    await sec.scrollIntoViewIfNeeded();
    await expect(sec.getByRole("tabpanel")).toBeVisible();
    await page.waitForTimeout(600);                                                              // sections lay out lazily: wait for the real height
    await expect.poll(async () => (await sec.boundingBox())!.height, { timeout: 8000 }).toBeLessThan(900);
    const before = (await sec.boundingBox())!.height;
    await sec.getByRole("tab").nth(2).click(); await page.waitForTimeout(400);
    expect(Math.abs((await sec.boundingBox())!.height - before)).toBeLessThan(40);          // switching services does not make the page jump
  });
});

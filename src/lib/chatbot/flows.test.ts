import { describe, expect, it } from "vitest";
import { completeSubmission, handleInput, initialState, type FlowState } from "./flows";

const say = (s: FlowState, text: string, value?: string) => handleInput(s, { text, value });
const lastText = (r: ReturnType<typeof say>) => r.messages[r.messages.length - 1]?.text ?? "";

function toConfirm() {
  let r = say(initialState(), "Start Project Enquiry", "cmd:start");
  r = say(r.state, "Website", "type:Website");
  r = say(r.state, "A site for my bakery with online ordering");
  r = say(r.state, "1–3 months", "timeline:1–3 months");
  r = say(r.state, "Asha Patel");
  r = say(r.state, "asha@example.com");
  r = say(r.state, "98765 43210");
  return r;
}

describe("extraction and skipping", () => {
  it("skips type and description for a descriptive opening message", () => {
    const r = say(initialState(), "I want to build a mobile app with login and payments");
    expect(r.state.data.projectType).toBe("Mobile Application");
    expect(r.state.data.projectDescription).toContain("login and payments");
    expect(r.state.step).toBe("timeline");
  });
  it("picks up timeline, email and phone from the first message", () => {
    const r = say(initialState(), "I need a website built within 1 month. My name is Ravi Kumar, ravi@example.com, 9876543210");
    expect(r.state.data).toMatchObject({ projectType: "Website", timeline: "Within 1 month", name: "Ravi Kumar", email: "ravi@example.com", phone: "+919876543210" });
    expect(r.state.step).toBe("confirm");
  });
  it("does not treat 'I'm looking for' as a name", () => {
    const r = say(initialState(), "I'm looking for a web app for my team");
    expect(r.state.data.name).toBeUndefined();
  });
  it("never asks about features, budget or company", () => {
    const r = toConfirm();
    expect(JSON.stringify(r.messages)).not.toMatch(/budget|feature|platform|integration|company|country/i);
  });
});

describe("validation", () => {
  it("rejects an invalid email and re-asks", () => {
    let r = say(initialState(), "I want to build a website for my shop");
    r = say(r.state, "Immediately", "timeline:Immediately");
    r = say(r.state, "Asha");
    r = say(r.state, "not-an-email");
    expect(r.state.step).toBe("email");
    expect(lastText(r)).toMatch(/does not look valid/);
  });
  it("normalises Indian phone numbers and allows skipping", () => {
    expect(toConfirm().state.data.phone).toBe("+919876543210");
    let r = say(initialState(), "I want to build a website for my shop");
    r = say(r.state, "Immediately", "timeline:Immediately");
    r = say(r.state, "Asha");
    r = say(r.state, "a@b.co");
    r = say(r.state, "Skip", "phone:skip");
    expect(r.state.step).toBe("confirm");
    expect(r.state.data.phone).toBe("");
  });
  it("rejects a malformed phone number", () => {
    let r = say(initialState(), "I want to build a website for my shop");
    r = say(r.state, "Immediately", "timeline:Immediately");
    r = say(r.state, "Asha");
    r = say(r.state, "a@b.co");
    r = say(r.state, "12345");
    expect(r.state.step).toBe("phone");
  });
});

describe("navigation", () => {
  it("goes back to the previous question without losing data", () => {
    const r = say(initialState(), "Start Project Enquiry", "cmd:start");
    const a = say(r.state, "Website", "type:Website");
    const b = say(a.state, "A site for my bakery");
    expect(b.state.step).toBe("timeline");
    const back = say(b.state, "Back", "cmd:back");
    expect(back.state.step).toBe("description");
    expect(back.state.data.projectType).toBe("Website");
  });
  it("edits a single field and returns to the summary", () => {
    const c = toConfirm();
    const pick = say(c.state, "Edit Details", "edit");
    expect(pick.state.step).toBe("edit_pick");
    const field = say(pick.state, "Name", "edit:name");
    const done = say(field.state, "Asha P Patel");
    expect(done.state.step).toBe("confirm");
    expect(done.state.data.name).toBe("Asha P Patel");
  });
  it("cancels at any time", () => {
    const c = toConfirm();
    const r = say(c.state, "Cancel", "cmd:cancel");
    expect(r.state.step).toBe("idle");
    expect(r.state.data).toEqual({});
    expect(say(c.state, "cancel").state.step).toBe("idle");
  });
});

describe("routing", () => {
  it("hands complaints and human requests to WhatsApp", () => {
    for (const t of ["I have a complaint", "can I talk to a human?"]) {
      const r = say(initialState(), t);
      expect(r.messages[0].action?.href).toMatch(/^https:\/\/wa\.me\/918263830296\?text=/);
    }
  });
  it("never states a price and flags the quotation", () => {
    const r = say(initialState(), "how much does a website cost?");
    expect(r.messages[0].text).toMatch(/depends on the scope/);
    expect(r.messages[0].text).not.toMatch(/₹|\$|rs\.?\s*\d/i);
    expect(r.state.quotation).toBe(true);
  });
  it("re-asks the current question after answering a pricing question mid-flow", () => {
    const start = say(initialState(), "Start Project Enquiry", "cmd:start");
    const r = say(start.state, "what is the price?");
    expect(r.messages).toHaveLength(2);
    expect(r.state.step).toBe("type");
  });
  it("mentions an existing product before a custom flow", () => {
    const r = say(initialState(), "I want an app to manage my driving school");
    expect(r.state.step).toBe("offer_product");
    expect(r.messages[0].text).toMatch(/MotoAdmin/);
    const p = say(r.state, "Enquire about MotoAdmin", "product:motoadmin");
    expect(p.state.mode).toBe("product");
    expect(p.state.step).toBe("description");
    const custom = say(r.state, "Custom project instead", "custom");
    expect(custom.state.mode).toBe("custom");
  });
  it("offers TenantPlane for Kubernetes multi-tenancy", () => {
    expect(say(initialState(), "we need kubernetes multi-tenancy").messages[0].text).toMatch(/TenantPlane/);
  });
  it("sends unknown questions to the model", () => {
    expect(say(initialState(), "What is retrieval augmented generation?").chat).toBe(true);
  });
});

describe("sending", () => {
  it("whatsapp: returns the payload and a wa.me link", () => {
    const r = say(toConfirm().state, "Send via WhatsApp", "send:whatsapp");
    expect(r.channel).toBe("whatsapp");
    expect(r.url).toMatch(/^https:\/\/wa\.me\/918263830296\?text=/);
    expect(r.submit).toMatchObject({ name: "Asha Patel", email: "asha@example.com", projectType: "Website", source: "chatbot" });
  });
  it("email: returns a Gmail compose link", () => {
    const r = say(toConfirm().state, "Send via Email", "send:email");
    expect(r.url).toMatch(/^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=hello%40deboistech\.in/);
  });
  it("only reports success when the API succeeded", () => {
    const sending = say(toConfirm().state, "Send via Email", "send:email").state;
    expect(completeSubmission(sending, true).messages[0].text).toMatch(/has been submitted/);
    const failed = completeSubmission(sending, false);
    expect(failed.messages[0].text).not.toMatch(/has been submitted/);
    expect(failed.messages[0].text).toMatch(/hello@deboistech\.in/);
    expect(failed.messages[0].options?.[0].label).toBe("Try Again");
    expect(say(failed.state, "Try Again", "send:retry").submit).toBeDefined();
  });
});

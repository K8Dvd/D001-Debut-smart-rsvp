/* ============ GOOGLE SHEETS BACKEND (optional, connect later) ============
   1) Create a Google Sheet with two tabs:
      "Guests"  header row: id | fullName | aliases | hint | table | seat | rsvp | partySize   (a leftover "message" column is harmless; delete it)
      "Replies" header row: submittedAt | guestId | name | status
   2) Extensions → Apps Script → paste this → set PIN below → Deploy → New deployment
      → Web app → Execute as: Me · Who has access: Anyone → copy the URL.
   3) Paste the URL in data.ts → API.endpoint. Done.
   Guests only receive THEIR OWN seat (matched on the server), the full list needs the PIN. */
const PIN = "change-me-123";

const sh = (n) => SpreadsheetApp.getActive().getSheetByName(n);
const rows = (n) => { const v = sh(n).getDataRange().getValues(); const h = v.shift(); return v.filter(r => r[0] !== "").map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
const norm = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const toGuest = (r) => ({ id: String(r.id), fullName: r.fullName, aliases: String(r.aliases || "").split(",").map(s => s.trim()).filter(Boolean), hint: r.hint || "",
  table: String(r.table), seat: String(r.seat), rsvp: r.rsvp || "pending", partySize: Number(r.partySize) || 1 });

function doGet(e) {
  const a = e.parameter.action;
  if (a === "lookup") {
    const q = norm(e.parameter.name || "");
    const m = rows("Guests").filter(r => [r.fullName, ...String(r.aliases || "").split(",")].some(n => norm(n) === q));
    return out({ matches: m.map(r => ({ id: String(r.id), fullName: r.fullName, hint: r.hint || "" })) });
  }
  if (a === "guest") { const r = rows("Guests").find(r => String(r.id) === e.parameter.id); return out({ guest: r ? toGuest(r) : null }); }
  if (a === "all") {
    if (e.parameter.pin !== PIN) return out({ error: "bad pin" });
    return out({ guests: rows("Guests").map(toGuest), replies: rows("Replies") });
  }
  return out({ ok: true });
}

function doPost(e) {
  const b = JSON.parse(e.postData.contents);
  if (b.action === "reply") {
    sh("Replies").appendRow([b.submittedAt, b.guestId, b.name, b.status]);
    const g = sh("Guests"), v = g.getDataRange().getValues(), h = v[0], idC = h.indexOf("id"), rC = h.indexOf("rsvp");
    for (let i = 1; i < v.length; i++) if (String(v[i][idC]) === String(b.guestId)) g.getRange(i + 1, rC + 1).setValue(b.status);
    return out({ ok: true });
  }
  if (b.action === "saveGuests" && b.pin === PIN) {
    const g = sh("Guests"), h = ["id", "fullName", "aliases", "hint", "table", "seat", "rsvp", "partySize"];
    g.clear(); g.appendRow(h);
    b.guests.forEach(x => g.appendRow([x.id, x.fullName, (x.aliases || []).join(","), x.hint || "", x.table, x.seat, x.rsvp, x.partySize || 1]));
    return out({ ok: true });
  }
  return out({ error: "denied" });
}

/* =====================================================================
   data.ts — THE DEBUT ISSUE · v2  (the ONLY file a customer edits)

   PUBLIC FOLDER MAP (drop files here, same names = nothing else to edit):
     /public/photos/photo-01.jpg … photo-20.jpg   ← 20 photos (photo-01 = cover portrait)
     /public/videos/couple-video.mp4              ← optional film
     /public/elements/  (transparent PNGs from Canva)
        seal.png               round monogram seal on the envelope
        corner-flower-left.png / corner-flower-right.png   square corner bouquets
        envelope-flower-left.png / envelope-flower-right.png  under the envelope
        ornament-line.png      thin divider (about 4:1)
        attire-sponsors|court|guests-men|women.png   (6 files, see ATTIRE)
        qr-gcash.png / qr-maya.png / qr-bank.png     gift QR codes
   While SHOW_PLACEHOLDERS = true, every missing file shows a dashed box with
   its filename so you can SEE where each PNG goes. Set false before delivering.
   ===================================================================== */

export const SHOW_PLACEHOLDERS = true;

/* ---------- Types ---------- */
export type RsvpStatus = "attending" | "declined" | "pending";
export interface Guest {
  id: string; fullName: string; aliases?: string[]; hint?: string;
  table: string; seat: string; rsvp: RsvpStatus; partySize?: number;
}
export interface GuestMatch { id: string; fullName: string; hint?: string }
export interface WordQuestion { question: string; answer: string }

/* ---------- ✏️ THEME (becomes CSS variables) ---------- */
export const THEME = {
  primary: "#8b0f24", secondary: "#3a0610", accent: "#c9a45c",
  background: "#0d0306", text: "#f6efe4",
  displayFont: "'Playfair Display', 'Didot', Georgia, serif",
  bodyFont: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

/* ============ ✏️ EVENT DATE: ONE LINE (YYYY-MM-DDTHH:MM:SS+08:00 = PH time) ============
   Countdown, long date and short date all update from this. */
const DEBUT_DATE = "2027-05-22T17:30:00+08:00";
const [Y, M, D] = DEBUT_DATE.slice(0, 10).split("-").map(Number);
const utc = new Date(Date.UTC(Y, M - 1, D));
const WEEKDAY = utc.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
const MONTH = utc.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
const LONG = `${WEEKDAY}, ${MONTH} ${D}, ${Y}`;
const SHORT = `${String(M).padStart(2, "0")}.${String(D).padStart(2, "0")}.${String(Y).slice(2)}`;

/* ---------- ✏️ EVENT ---------- */
export const EVENT = {
  title: "The Debut Issue", issueLabel: "ISSUE NO. 01",
  debutante: "Floryn Angela Santos", firstName: "Floryn", nickname: "Floryn",  // firstName = BIG cover type. Try "Floryn Angela" or the full name.
  milestone: "18", milestoneLabel: "The Eighteenth",
  headline: "One night. One story. Your seat is waiting.",
  dateISO: DEBUT_DATE, weekday: WEEKDAY, month: MONTH, day: D, year: Y, dateDisplay: LONG, dateShort: SHORT, timeDisplay: "5:30 PM",
  venueName: "Okada Manila", address: "New Seaside Drive, Entertainment City, Parañaque, Metro Manila",  // ← please verify the address
  mapLink: "https://maps.app.goo.gl/MJ3nqTScP5GP5aeD9",   // "Open map" button ("" hides it)
  mapEmbed: "https://www.google.com/maps?q=Okada+Manila&ll=14.5151576,120.9814988&z=16&output=embed",  // live map preview ("" hides it)
  dressCode: "Formal · Crimson, black or ivory", rsvpDeadline: "April 30, 2027",
  invitation: "With joy in our hearts, we invite you to be part of the night she steps into the spotlight. Your presence is the best gift.",
  description: "An evening of music, memories and a little bit of magic as we celebrate a milestone.",
  welcome: "Welcome, {name}. We saved a place for you.",   // ticket greeting; {name} = guest first name
  rsvpInstructions: "Search your name to find your table and seat.",
  closing: "Thank you for being part of the story.", hashtag: "#TheDebutIssue",
  calendarDurationHours: 5,   // length of the "Add to calendar" entry
  contact: { label: "Message the host", href: "" },
};

/* ---------- ✏️ MIRROR FLOWERS ----------
   false (default) = use both PNGs as they are.
   true = the LEFT corners reuse the RIGHT flower picture flipped (corner-flower-left.png is not used). */
export const MIRROR_FLOWERS = false;

/* ---------- ✏️ FLOWER SIZE (make one side bigger/smaller) ----------
   1 = same size for both sides (default). Only change if one side looks off: e.g. left: 0.9 makes the left smaller. */
export const FLOWER_SCALE = { left: 1, right: 1 };

/* ---------- ✏️ MEDIA ---------- */
export const PHOTO = (n: number) => `/photos/photo-${String(n).padStart(2, "0")}.jpg`;
export const PHOTOS = Array.from({ length: 20 }, (_, i) => PHOTO(i + 1));
export const MEDIA = {
  heroPhoto: 1,            // photo-01.jpg = cover portrait
  envelopeBgPhoto: 2,      // blurred background behind the envelope
  scratchPhoto: 3,         // the debutante photo hidden under the scratch foil
  closingPhoto: 20,
  // Where photos are cropped. Default keeps heads in frame (focus near the top).
  // If one photo still cuts a head, add it here:  focus: { 7: "center 5%", 12: "left 15%" }
  defaultFocus: "center 10%",
  focus: { 12: "center 0%" } as Record<number, string>,   // photo-12 pinned to the very top; add more like { 7: "center 5%" }
  video: "/videos/couple-video.mp4", videoPoster: 4,
  carousel: [1, 5, 8, 11, 14, 17, 3, 6, 9, 12, 15, 18, 2, 4, 7, 10, 13, 16, 19, 20],
};
export const ELS = {
  seal: "/elements/seal.png",
  cornerLeft: "/elements/corner-flower-left.png", cornerRight: "/elements/corner-flower-right.png",
  envFlowerLeft: "/elements/envelope-flower-left.png", envFlowerRight: "/elements/envelope-flower-right.png",
  ornament: "/elements/ornament-line.png",
};

/* ---------- ✏️ MUSIC (autoplays after the guest opens the envelope; small button on the side) ---------- */
export const MUSIC = { enabled: true, title: "Theme Song", youtubeId: "aqRr2TQnpPw", startAt: 0, volume: 60, localFile: "" };

/* ---------- ✏️ FALLING PETALS (shown on the whole page) ----------
   colors = list of [light, main, dark] shades. Petals take turns using each one.
   Examples: pink ["#ffb3c7","#ff6f9b","#b83263"] · gold ["#f5e2a8","#c9a45c","#8a6a25"] · white ["#ffffff","#f1e6dc","#cdb9a8"] */
export const PETALS = {
  enabled: true, count: 16,
  colors: [
    ["#c4152f", "#8b0f24", "#5a0a16"],   // crimson
  ] as string[][],
};

/* ---------- ✏️ ADMIN LIST ---------- */
export const ADMIN_PAGE_SIZE = 10;   // guests / replies per page (try 12)

/* ---------- ✏️ STORY TIMELINE (photos = [large, small]) ---------- */
export const STORY = [
  { year: "2009", title: "The Beginning", text: "Write a short line about the debutante's early years.", photos: [5, 6] },
  { year: "2015", title: "Growing Up", text: "A favorite memory from childhood or school.", photos: [7, 8] },
  { year: "2022", title: "Finding Her Voice", text: "Passions, achievements, the people who shaped her.", photos: [9, 10] },
  { year: "2027", title: "The Debut", text: "And now, the night she steps into the light.", photos: [11, 12] },
];

/* ---------- ✏️ PROGRAM ---------- */
export const PROGRAM = [
  { time: "4:30 PM", title: "Doors & Red Carpet", note: "Photos at the step-and-repeat" },
  { time: "5:30 PM", title: "Grand Entrance" }, { time: "6:00 PM", title: "Dinner Service" },
  { time: "7:00 PM", title: "Debut Rituals", note: "Roses · Candles · Treasures" },
  { time: "8:00 PM", title: "Toasts & Tribute Film" }, { time: "8:30 PM", title: "Dance Floor Opens" },
];

/* ---------- ✏️ ATTIRE (PNG per group in /public/elements) ---------- */
export const ATTIRE = {
  strict: "The dress code is strictly observed. Guests who do not follow it may be asked to change.",
  colors: [
    { name: "Crimson", hex: "#8b0f24" }, { name: "Burgundy", hex: "#4a0a16" },
    { name: "Ivory", hex: "#f6efe4" }, { name: "Black", hex: "#111111" }, { name: "Gold", hex: "#c9a45c" },
  ],
  groups: [
    { id: "sponsors", title: "Sponsors", men: { label: "Gentlemen", note: "Formal suit, burgundy tie", image: "/elements/attire-sponsors-men.png" }, women: { label: "Ladies", note: "Burgundy long dress", image: "/elements/attire-sponsors-women.png" } },
    { id: "court", title: "The Court", men: { label: "Gentlemen", note: "Black suit, red tie", image: "/elements/attire-court-men.png" }, women: { label: "Ladies", note: "Crimson long gown", image: "/elements/attire-court-women.png" } },
    { id: "guests", title: "Guests", men: { label: "Gentlemen", note: "Formal wear in the palette", image: "/elements/attire-guests-men.png" }, women: { label: "Ladies", note: "Formal dress in the palette", image: "/elements/attire-guests-women.png" } },
  ],
  avoid: ["White (reserved for the debutante)", "Jeans and denim", "Shorts, slippers, sneakers"],
};

/* ---------- ✏️ ENTOURAGE (SAMPLE NAMES: replace with your real names) ---------- */
export const ENTOURAGE = {
  parents: ["Mr. Roberto Santos", "Mrs. Lorna Santos"],
  sponsors: ["Mr. & Mrs. Ramon Villanueva", "Mr. & Mrs. Eduardo Navarro", "Mr. & Mrs. Rolando Salazar",
    "Mr. & Mrs. Armando Domingo", "Mr. & Mrs. Gregorio Aquino", "Mr. & Mrs. Teodoro Castillo"],  // shown centered
  groups: [   // add / remove / rename groups freely
    { title: "18 Roses", note: "", names: [
      "Angelica Reyes", "Bianca Ocampo", "Camille Torres",
      "Danica Aquino", "Elaine Navarro", "Francesca Fernandez",
      "Gabrielle Santiago", "Hannah Cruz", "Isabel Garcia",
      "Jasmine Flores", "Kristine Castillo", "Lorraine Salazar",
      "Mikaela Lopez", "Nicole Dizon", "Patricia Bautista",
      "Rhea Mendoza", "Samantha Ramos", "Trisha Villanueva",
    ] },
    { title: "18 Candles", note: "", names: [
      "Vanessa Mendoza", "Yvette Ramos", "Zoe Villanueva",
      "Alyssa Domingo", "Bea Rivera", "Carla Reyes",
      "Denise Ocampo", "Erika Torres", "Fiona Aquino",
      "Gwen Navarro", "Hazel Fernandez", "Irene Santiago",
      "Janelle Cruz", "Kyla Garcia", "Louise Flores",
      "Nadine Castillo", "Olivia Salazar",
    ] },
    { title: "18 Treasures", note: "", names: [
      "Danica Aquino", "Elaine Navarro", "Francesca Fernandez",
      "Gabrielle Santiago", "Hannah Cruz", "Isabel Garcia",
      "Jasmine Flores", "Kristine Castillo", "Lorraine Salazar",
      "Mikaela Lopez", "Nicole Dizon", "Patricia Bautista",
      "Rhea Mendoza", "Samantha Ramos", "Trisha Villanueva",
      "Vanessa Domingo", "Yvette Rivera", "Zoe Reyes",
    ] },
    { title: "18 Shots", note: "Gentlemen", names: [
      "Adrian Bautista", "Benedict Mendoza", "Carlo Ramos",
      "Daniel Villanueva", "Emmanuel Domingo", "Francis Rivera",
      "Gabriel Reyes", "Harvey Ocampo", "Ivan Torres",
      "Jericho Aquino", "Kenneth Navarro", "Lorenzo Fernandez",
      "Marco Santiago", "Nathan Cruz", "Oscar Garcia",
      "Paolo Flores", "Rafael Castillo", "Sebastian Salazar",
    ] },
  ],
};

/* ---------- ✏️ GIFTS & QR (drop QR images in /public/elements/) ---------- */
export const GIFTS = {
  message: "Your presence is the greatest gift. If you wish to give more, a monetary gift is warmly appreciated.",
  options: [
    { name: "GCash", accountName: "Floryn A. Santos", number: "0900 000 0000", qr: "/elements/qr-gcash.png" },
    { name: "Maya", accountName: "Floryn A. Santos", number: "0900 000 0000", qr: "/elements/qr-maya.png" },
    { name: "Bank Transfer", accountName: "Roberto Santos", number: "0000 0000 0000", qr: "/elements/qr-bank.png" },
  ],  // delete an option to hide it; number "" hides the copy button
};

/* ---------- ✏️ SCRATCH CARD (the debutante photo is revealed) ---------- */
export const SCRATCH = {
  heading: "Scratch to reveal", hint: "Use your finger or mouse, or tap the button.",
  caption: "Tonight, you're part of the story.",
};

/* ---------- ✏️ WORD SEARCH (answers hidden in the puzzle, letters only) ---------- */
export const WORDSEARCH = {
  heading: "The Debut Quiz", intro: "Answer each clue by finding the word in the puzzle.", gridSize: 11,
  questions: [
    { question: "The color of the red carpet.", answer: "CRIMSON" },
    { question: "What guests take to remember the night.", answer: "PHOTO" },
    { question: "A flower given during the 18 Roses.", answer: "ROSE" },
  ] as WordQuestion[],
  complete: "All found! You're officially on the guest list of legends.",
};

/* =====================================================================
   GOOGLE SHEETS (connect later)
   1) Paste the Apps Script (see apps-script.gs) in your Sheet, deploy as Web App.
   2) Paste the URL in API.endpoint and set the same PIN in the script.
   endpoint "" = DEMO mode: admin + RSVP work in THIS browser only.
   ===================================================================== */
export const API = { endpoint: "https://script.google.com/macros/s/AKfycbzvw-msWW2ukZ6E8MhTVyCuOn1lbERrhFC7wxurPCxpfKFppsrlpZdl20KwVyglCP_v/exec", adminPin: "debut2027" /* demo only, visible in code: NOT security */ };

/* ---------- ✏️ GUEST LIST (demo data; the live list comes from your Sheet) ----------
   ⚠️ Anything here is public in the downloaded JavaScript. */
export const GUESTS: Guest[] = [   // SAMPLE guests: used only in demo mode (no Google Sheet). One row = one person = one seat.
  { id: "g001", fullName: "Angelica Reyes", aliases: ["Angel Reyes"], table: "01", seat: "1", rsvp: "attending", partySize: 1 },
  { id: "g002", fullName: "Benedict Cruz", table: "01", seat: "2", rsvp: "attending", partySize: 1 },
  { id: "g003", fullName: "Camille Bautista", table: "01", seat: "3", rsvp: "pending", partySize: 1 },
  { id: "g004", fullName: "Daniel Ocampo", table: "02", seat: "1", rsvp: "attending", partySize: 1 },
  { id: "g005", fullName: "Elaine Garcia", table: "02", seat: "2", rsvp: "declined", partySize: 1 },
  { id: "g006", fullName: "Maria Santos", hint: "Family side", table: "03", seat: "1", rsvp: "attending", partySize: 1 },
  { id: "g007", fullName: "Maria Santos", hint: "Friends side", table: "04", seat: "5", rsvp: "pending", partySize: 1 },
  { id: "g008", fullName: "Francis Mendoza", aliases: ["Kiko Mendoza"], table: "04", seat: "1", rsvp: "attending", partySize: 1 },
  { id: "g009", fullName: "Gabrielle Torres", table: "05", seat: "4", rsvp: "pending", partySize: 1 },
];
export const GUESTS_KEY = "debut-guests-v2";   // admin edits (demo) are stored here
export const REPLIES_KEY = "debut-replies-v2";

export const normalizeName = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const readGuests = (): Guest[] => { try { const v = localStorage.getItem(GUESTS_KEY); return v ? JSON.parse(v) : GUESTS; } catch { return GUESTS; } };

/** Returns ONLY id/name/hint, never table/seat. Live mode: Apps Script `?action=lookup&name=`. */
export async function lookupGuests(query: string): Promise<GuestMatch[]> {
  const q = normalizeName(query);
  if (!q) return [];
  if (API.endpoint) {
    const r = await (await fetch(`${API.endpoint}?action=lookup&name=${encodeURIComponent(q)}`)).json();
    return (r.matches ?? []) as GuestMatch[];
  }
  await new Promise((r) => setTimeout(r, 600));
  return readGuests().filter((g) => [g.fullName, ...(g.aliases ?? [])].some((n) => normalizeName(n) === q))
    .map(({ id, fullName, hint }) => ({ id, fullName, hint }));
}
export async function getGuest(id: string): Promise<Guest | null> {
  if (API.endpoint) {
    const r = await (await fetch(`${API.endpoint}?action=guest&id=${encodeURIComponent(id)}`)).json();
    return (r.guest ?? null) as Guest | null;
  }
  return readGuests().find((g) => g.id === id) ?? null;
}
/** Sends a reply. Live: posts to your Sheet. Demo: saves in this browser only. */
export async function sendReply(payload: Record<string, unknown>) {
  const body = { ...payload, submittedAt: new Date().toISOString() };
  if (API.endpoint) { await fetch(API.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "reply", ...body }) }); return; }
  try { const l = JSON.parse(localStorage.getItem(REPLIES_KEY) ?? "[]"); localStorage.setItem(REPLIES_KEY, JSON.stringify([...l, body])); } catch { /* ignore */ }
}
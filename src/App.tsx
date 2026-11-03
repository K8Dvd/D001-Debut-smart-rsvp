/* =====================================================================
   App.tsx — THE DEBUT ISSUE · v2
   You should NOT need to edit this file. All content lives in data.ts.
   ===================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as RPointerEvent, ReactNode } from "react";
import {
  API, ATTIRE, ELS, ENTOURAGE, EVENT, GUESTS, GUESTS_KEY, MEDIA, MUSIC, PHOTO, PROGRAM, REPLIES_KEY, SCRATCH,
  GIFTS, ADMIN_PAGE_SIZE, FLOWER_SCALE, MIRROR_FLOWERS, PETALS, SHOW_PLACEHOLDERS, STORY, THEME, WORDSEARCH, getGuest, lookupGuests, sendReply,
} from "./data";
import type { Guest, GuestMatch, RsvpStatus } from "./data";

/* ---------------------------------------------------------------- helpers */
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const goTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
const STATUS_LABEL: Record<RsvpStatus, string> = { attending: "Attending", pending: "Awaiting reply", declined: "Declined" };
const pad = (n: number) => String(n).padStart(2, "0");

/** Transparent PNG slot (Canva flowers etc). Missing file → dashed placeholder showing the filename. */
function Slot({ src, className = "", ar = "1/1", flow, alt = "" }: { src: string; className?: string; ar?: string; flow?: boolean; alt?: string }) {
  const [bad, setBad] = useState(false);
  const cls = `${flow ? "" : "deco"} ${className}`;
  if (bad) return SHOW_PLACEHOLDERS
    ? <span className={`slot ${cls}`} style={{ aspectRatio: ar }} role="img" aria-label={`Placeholder for ${src}`}><b>{src.split("/").pop()}</b></span> : null;
  return <img className={cls} src={src} alt={alt} aria-hidden={alt ? undefined : true} onError={() => setBad(true)} />;
}
/** Photo n = 1…20 → /photos/photo-NN.jpg. Always shown WHOLE: never cropped, never stretched.
 *  fill = fixed frame (scratch card): the whole photo sits over a soft blurred copy of itself. */
function Photo({ n, ratio = "3/4", className = "", fill, frame, alt = "", eager }: { n: number; ratio?: string; className?: string; fill?: boolean; frame?: boolean; alt?: string; eager?: boolean }) {
  const [bad, setBad] = useState(false);
  const [ok, setOk] = useState(false);
  const src = PHOTO(n);
  const mode = fill ? "photo--fill" : frame ? "photo--frame" : "photo--natural";
  if (bad) return <div className={`photo ${mode} ${className}`}>{SHOW_PLACEHOLDERS && <span className="ph" style={fill ? undefined : { aspectRatio: ratio }}>photo-{pad(n)}.jpg</span>}</div>;
  return (
    <div className={`photo ${mode}${ok ? " is-loaded" : ""} ${className}`}>
      {fill && <img className="photo__bg" src={src} alt="" aria-hidden="true" />}
      <img className="photo__img" src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async"
        style={frame ? { objectPosition: MEDIA.focus[n] ?? MEDIA.defaultFocus } : undefined}
        ref={(el) => { if (el?.complete && el.naturalWidth) setOk(true); }} onLoad={() => setOk(true)} onError={() => setBad(true)} />
    </div>
  );
}
const Flora = ({ bottom }: { bottom?: boolean }) => {
  const L = MIRROR_FLOWERS ? ELS.cornerRight : ELS.cornerLeft, m = MIRROR_FLOWERS ? " mir" : "";
  return (
    <div className="flora" aria-hidden="true">
      <Slot src={L} className={`fl tl float${m}`} /><Slot src={ELS.cornerRight} className="fl tr float s2" />
      {bottom && <><Slot src={L} className={`fl bl float${m}`} /><Slot src={ELS.cornerRight} className="fl br float s2" /></>}
    </div>
  );
};
const Ornament = () => <Slot src={ELS.ornament} flow ar="4/1" className="orn" />;

function useCountdown(iso: string) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, target - now);
  return { done: Number.isFinite(target) && ms === 0, valid: Number.isFinite(target),
    d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
}

function useConfetti() {
  const [pieces, setPieces] = useState<{ id: number; style: CSSProperties }[]>([]);
  const timer = useRef<number>(0);
  const fire = useCallback(() => {
    if (reduced()) return;
    const cols = [THEME.accent, THEME.primary, THEME.text, "#ffffff"];
    setPieces(Array.from({ length: 70 }, (_, i) => ({
      id: Date.now() + i,
      style: { left: `${Math.random() * 100}%`, background: cols[i % cols.length], animationDelay: `${Math.random() * 0.4}s`,
        ["--dx" as string]: `${(Math.random() - 0.5) * 260}px`, ["--r" as string]: `${Math.random() * 720}deg` } as CSSProperties,
    })));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPieces([]), 3300);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node = pieces.length ? <div className="confetti" aria-hidden="true">{pieces.map((p) => <i key={p.id} style={p.style} />)}</div> : null;
  return { fire, node };
}


/* ------------------------------------------------------------ music (YouTube, hidden) */
declare global { interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void } }
function loadYT(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((res) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); res(window.YT); };
    if (!document.getElementById("yt-api")) {
      const s = document.createElement("script"); s.id = "yt-api"; s.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(s);
    }
  });
}
function useMusic() {
  const [playing, setPlaying] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const creating = useRef(false);

  const play = useCallback(async () => {
    if (!MUSIC.enabled) return;
    if (MUSIC.localFile) {
      if (!audio.current) { audio.current = new Audio(MUSIC.localFile); audio.current.loop = true; audio.current.volume = MUSIC.volume / 100; }
      try { await audio.current.play(); setPlaying(true); } catch { setPlaying(false); }
      return;
    }
    if (player.current) { player.current.playVideo?.(); setPlaying(true); return; }
    if (creating.current || !host.current || !MUSIC.youtubeId) return;
    creating.current = true;
    try {
      const YT = await loadYT();
      const el = document.createElement("div"); host.current.appendChild(el);
      player.current = new YT.Player(el, {
        width: "1", height: "1", videoId: MUSIC.youtubeId,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1, rel: 0, modestbranding: 1,
          start: MUSIC.startAt, loop: 1, playlist: MUSIC.youtubeId },
        events: {
          onReady: (e: any) => { e.target.setVolume(MUSIC.volume); e.target.playVideo(); },
          onStateChange: (e: any) => { if (e.data === 1) setPlaying(true); if (e.data === 2) setPlaying(false); },
          onError: () => setPlaying(false),
        },
      });
      setPlaying(true);
    } catch { creating.current = false; setPlaying(false); }
  }, []);
  const pause = useCallback(() => { player.current?.pauseVideo?.(); audio.current?.pause(); setPlaying(false); }, []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  useEffect(() => () => { player.current?.destroy?.(); audio.current?.pause(); }, []);
  return { playing, toggle, play, host };
}


/* ------------------------------------------------------------ small pieces */
const Marquee = ({ n = 28 }: { n?: number }) => (
  <div className="marquee" aria-hidden="true">{Array.from({ length: n }, (_, i) => <span className="bulb" key={i} />)}</div>
);
const Petals = () => {
  const n = PETALS.count;
  const items = useMemo(() => Array.from({ length: n }, (_, i) => ({ id: i, left: Math.random() * 100, size: 10 + Math.random() * 12,
    dur: 12 + Math.random() * 9, delay: -Math.random() * 18, sway: 30 + Math.random() * 60,
    color: PETALS.colors[i % PETALS.colors.length] })), [n]);
  return <div className="petals" aria-hidden="true">{items.map((p) => <i key={p.id} style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.25,
    animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, ["--sway" as string]: `${p.sway}px`,
    background: `linear-gradient(135deg, ${p.color[0]}, ${p.color[1]} 60%, ${p.color[2]})` } as CSSProperties} />)}</div>;
};
const Sparkles = () => {
  const items = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ id: i, left: Math.random() * 100,
    dur: 7 + Math.random() * 8, delay: -Math.random() * 12 })), []);
  return <div className="sparkles" aria-hidden="true">{items.map((s) =>
    <span key={s.id} className="sparkle" style={{ left: `${s.left}%`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />)}</div>;
};
/** Saves the guest's ticket + event summary as a PNG picture (drawn on a canvas, no extra libraries). */
async function renderTicketBlob(guest: Guest, status: RsvpStatus): Promise<Blob | null> {
  const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"); if (!x) return null;
  try { await Promise.race([new Promise((r) => setTimeout(r, 2500)), Promise.all([document.fonts.load(`800 80px ${THEME.displayFont}`), document.fonts.load(`italic 500 40px ${THEME.displayFont}`), document.fonts.load(`600 24px ${THEME.bodyFont}`)])]); } catch { /* system fonts are fine */ }
  const load = (src: string) => new Promise<HTMLImageElement | null>((res) => { const im = new Image(); const to = setTimeout(() => res(null), 6000); im.onload = () => { clearTimeout(to); res(im); }; im.onerror = () => { clearTimeout(to); res(null); }; im.src = src; });
  const [photo, cl, cr] = await Promise.all([load(PHOTO(MEDIA.heroPhoto)), load(MIRROR_FLOWERS ? ELS.cornerRight : ELS.cornerLeft), load(ELS.cornerRight)]);
  type O = { color?: string; weight?: number; display?: boolean; italic?: boolean; ls?: string; x?: number };
  const setFont = (px: number, o: O) => {
    x.font = `${o.italic ? "italic " : ""}${o.weight ?? 400} ${px}px ${o.display ? THEME.displayFont : THEME.bodyFont}`;
    x.fillStyle = o.color ?? THEME.text; x.textAlign = "center"; x.textBaseline = "alphabetic";
    (x as unknown as { letterSpacing: string }).letterSpacing = o.ls ?? "0px";
  };
  const put = (t: string, y: number, px: number, o: O = {}) => { setFont(px, o); x.fillText(t, o.x ?? W / 2, y); };
  const fit = (t: string, y: number, px: number, maxW: number, o: O = {}) => { setFont(px, o); while (x.measureText(t).width > maxW && px > 36) { px -= 4; setFont(px, o); } x.fillText(t, o.x ?? W / 2, y); };
  const wrap = (t: string, px: number, maxW: number, o: O = {}) => {
    setFont(px, o); const lines: string[] = []; let cur = "";
    t.split(" ").forEach((w) => { const n = cur ? `${cur} ${w}` : w; if (x.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; });
    if (cur) lines.push(cur); return lines.slice(0, 2);
  };
  const soft = "rgba(246,239,228,.72)", ink = "#2a0710";

  x.fillStyle = THEME.background; x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(W / 2, 900, 40, W / 2, 900, 950); glow.addColorStop(0, THEME.primary + "99"); glow.addColorStop(1, "transparent");
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  if (photo) {
    const r = Math.max(W / photo.width, 720 / photo.height), pw = photo.width * r, ph = photo.height * r;
    x.save(); x.beginPath(); x.rect(0, 0, W, 720); x.clip(); x.drawImage(photo, (W - pw) / 2, 0, pw, ph); x.restore();
    const fade = x.createLinearGradient(0, 300, 0, 730); fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(1, THEME.background);
    x.fillStyle = fade; x.fillRect(0, 300, W, 440);
  }
  if (cl) { if (MIRROR_FLOWERS) { x.save(); x.translate(320, 0); x.scale(-1, 1); x.drawImage(cl, 0, 0, 320, (cl.height / cl.width) * 320); x.restore(); } else x.drawImage(cl, 0, 0, 320, (cl.height / cl.width) * 320); }
  if (cr) x.drawImage(cr, W - 320, 0, 320, (cr.height / cr.width) * 320);
  x.strokeStyle = THEME.accent; x.lineWidth = 3; x.strokeRect(36, 36, W - 72, H - 72); x.lineWidth = 1; x.strokeRect(52, 52, W - 104, H - 104);

  put(`${EVENT.issueLabel} · YOU'RE INVITED`, 120, 26, { color: THEME.accent, weight: 600, ls: "8px" });
  put("THE DEBUT OF", 598, 24, { color: soft, weight: 600, ls: "10px" });
  fit(EVENT.debutante, 690, 92, 900, { display: true, italic: true, weight: 500, color: THEME.text });

  x.fillStyle = THEME.text; x.fillRect(90, 770, 900, 560);                       // ticket panel
  x.fillStyle = THEME.background; [90, 990].forEach((px) => { x.beginPath(); x.arc(px, 1010, 28, 0, Math.PI * 2); x.fill(); });
  put(`ADMIT · ${guest.partySize && guest.partySize > 1 ? `PARTY OF ${guest.partySize}` : "ONE"}`, 835, 22, { color: THEME.primary, weight: 600, ls: "6px" });
  fit(guest.fullName, 930, 80, 800, { display: true, weight: 800, color: ink });
  x.save(); x.setLineDash([14, 12]); x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(130, 1010); x.lineTo(950, 1010); x.stroke(); x.restore();
  x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 2; x.beginPath(); x.moveTo(540, 1060); x.lineTo(540, 1260); x.stroke();
  put("TABLE", 1080, 24, { color: THEME.primary, weight: 600, ls: "8px", x: 330 }); put("SEAT", 1080, 24, { color: THEME.primary, weight: 600, ls: "8px", x: 750 });
  fit(guest.table, 1240, 190, 360, { display: true, weight: 800, color: THEME.primary, x: 330 }); fit(guest.seat, 1240, 190, 360, { display: true, weight: 800, color: THEME.primary, x: 750 });
  put(STATUS_LABEL[status].toUpperCase(), 1305, 22, { color: ink, weight: 600, ls: "6px" });

  fit(`${EVENT.dateDisplay} · ${EVENT.timeDisplay}`, 1408, 44, 920, { display: true, italic: true, weight: 500, color: THEME.accent });
  put(EVENT.venueName, 1474, 38, { weight: 600, ls: "3px" });
  wrap(EVENT.address, 26, 860, { color: soft }).forEach((l, k) => put(l, 1516 + k * 34, 26, { color: soft }));
  fit(`DRESS CODE · ${EVENT.dressCode}`.toUpperCase(), 1604, 22, 900, { color: THEME.accent, weight: 600, ls: "3px" });
  const n = PROGRAM.length, step = Math.min(36, n > 1 ? (1830 - 1672) / (n - 1) : 36);
  PROGRAM.forEach((p, k) => put(`${p.time}  ·  ${p.title}`, 1672 + k * step, 27, { color: soft }));
  put(EVENT.hashtag, 1872, 22, { color: THEME.accent, weight: 600, ls: "6px" });

  return await new Promise<Blob | null>((r) => { try { c.toBlob(r, "image/png"); } catch { r(null); } });
}


/** Shows the finished ticket picture. Mobile: "Save" opens the share sheet (Save Image); fallback = press & hold the picture. Desktop: downloads the PNG. */
function TicketModal({ blob, name, onClose }: { blob: Blob; name: string; onClose: () => void }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const file = `${name.trim().replace(/\s+/g, "-").toLowerCase()}-ticket.png`;
  const save = async () => {
    try {
      const f = new File([blob], file, { type: "image/png" });
      if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: `${EVENT.title} ticket` }); return; }
    } catch { /* cancelled or unsupported → fall through to download */ }
    const a = document.createElement("a"); a.href = url; a.download = file; document.body.appendChild(a); a.click(); a.remove();
  };
  return (
    <div className="tmodal" role="dialog" aria-modal="true" aria-label="Your ticket" onClick={onClose}>
      <div className="tmodal__box" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt={`Ticket for ${name}`} />
        <p className="fine">On phone: tap Save, then choose “Save Image”. Or press and hold the picture.</p>
        <div className="result__actions" style={{ justifyContent: "center", marginTop: ".6rem" }}>
          <button className="btn" onClick={save}>Save ticket</button>
          <a className="btn btn--ghost" href={url} download={file}>Download</a>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const Section = ({ id, kicker, title, children, band, flora, center }:
  { id: string; kicker: string; title: ReactNode; children: ReactNode; band?: boolean; flora?: boolean; center?: boolean }) => (
  <section id={id} className={band ? "section--band" : undefined} aria-labelledby={`${id}-t`}>
    {flora && <Flora bottom />}
    <div className={`${band ? "inner section" : "section"}${center ? " is-center" : ""}${flora ? " has-flora" : ""}`}>
      <div className="reveal"><p className="kicker">{kicker}</p><h2 className="h2" id={`${id}-t`}>{title}</h2></div>
      {children}
    </div>
  </section>
);

/* ------------------------------------------------------------ side music button */
function MusicBtn({ music }: { music: ReturnType<typeof useMusic> }) {
  if (!MUSIC.enabled) return null;
  return (
    <button className={`music${music.playing ? " playing" : ""}`} onClick={music.toggle} aria-pressed={music.playing}
      aria-label={music.playing ? `Pause music: ${MUSIC.title}` : `Play music: ${MUSIC.title}`} title={MUSIC.title}><i /><i /><i /><i /></button>
  );
}

/** Thin gold reading-progress line under the nav. */
function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const upd = () => { raf = 0; const h = document.documentElement.scrollHeight - window.innerHeight; bar.current?.style.setProperty("--p", String(h > 0 ? Math.min(1, window.scrollY / h) : 0)); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(upd); };
    window.addEventListener("scroll", onScroll, { passive: true }); upd();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return <div className="pgbar" ref={bar} aria-hidden="true" />;
}

/* ------------------------------------------------------------ nav */
const NAV = [["invitation", "Invitation"], ["details", "Details"], ["story", "Story"], ["seat", "Find My Seat"],
  ["attire", "Attire"], ["entourage", "Entourage"], ["gifts", "Gifts"], ["play", "Play"]] as const;
function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-45% 0px -50% 0px" });
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <header className="nav">
      <a className="nav__brand" href="#top" onClick={(e) => { e.preventDefault(); goTo("top"); }}>{EVENT.firstName}</a>
      <nav aria-label="Primary">
        <ul className={`nav__links${open ? " is-open" : ""}`} id="menu">
          {NAV.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} className={active === id ? "is-active" : ""}
              onClick={(e) => { e.preventDefault(); setOpen(false); goTo(id); }}>{label}</a></li>
          ))}
        </ul>
      </nav>
      <button className="icon-btn nav__toggle" aria-expanded={open} aria-controls="menu" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
    </header>
  );
}

/* ------------------------------------------------------------ envelope entrance */
type Stage = "closed" | "seal" | "flap" | "rise" | "burst" | "gone";
const STAGES: Stage[] = ["closed", "seal", "flap", "rise", "burst", "gone"];
function Envelope({ onStart, onOpen }: { onStart: () => void; onOpen: () => void }) {
  const [stage, setStage] = useState<Stage>("closed");
  const timers = useRef<number[]>([]);
  const at = (s: Stage) => STAGES.indexOf(stage) >= STAGES.indexOf(s);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const start = () => {
    if (stage !== "closed") return;
    onStart(); // runs inside the tap, so the browser allows the music to start
    const q = reduced() ? 0.3 : 1;
    const t = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms * q));
    setStage("seal"); t(() => setStage("flap"), 550); t(() => setStage("rise"), 1500);
    t(() => { setStage("burst"); onOpen(); }, 2800); t(() => setStage("gone"), 4400);
  };
  if (stage === "gone") return null;
  return (
    <div className={`env-stage${at("burst") ? " burst" : ""}`} role="dialog" aria-label="Debut invitation">
      <div className="env-bg" style={{ backgroundImage: `url(${PHOTO(MEDIA.envelopeBgPhoto)})` }} />
      <div className="leak" /><Sparkles /><Flora bottom />
      <div className="env-inner">
        <p className="env-kicker">{EVENT.issueLabel} · You're invited</p>
        <div className="env-wrap">
          <div className={`env${at("seal") ? " seal-on" : ""}${at("flap") ? " flap-open" : ""}${at("rise") ? " rise" : ""}`}>
            <div className="env-back" />
            <div className="env-card"><p className="card-small">The debut of</p><h1 className="card-names">{EVENT.debutante}</h1><p className="card-date">{EVENT.dateShort}</p></div>
            <div className="env-front" />
            <div className="env-flap" />
            <button className="seal" onClick={start} aria-label="Open the invitation">
              <span className="ring" /><span className="ring r2" /><Slot src={ELS.seal} flow ar="1/1" className="seal-img" />
            </button>
          </div>
          <Slot src={ELS.envFlowerLeft} className="env-fl l float" /><Slot src={ELS.envFlowerRight} className="env-fl r float s2" />
        </div>
        <p className="env-tap">Tap the seal to open</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ cover (no buttons: just scroll) */
function Cover() {
  const media = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced()) return;
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      if (media.current) media.current.style.transform = `translate3d(0,${Math.min(window.scrollY, 900) * 0.18}px,0)`; }); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="cover" id="top" aria-label="Cover">
      <div className="cover__media" ref={media}>
        <img className="cover__img" src={PHOTO(MEDIA.heroPhoto)} alt={`Portrait of ${EVENT.debutante}`} style={{ objectPosition: MEDIA.focus[MEDIA.heroPhoto] ?? MEDIA.defaultFocus }} onError={(e) => (e.currentTarget.style.display = "none")} />
        <div className="cover__shade" />
      </div>
      <div className="leak" /><div className="spotlight spotlight--l" /><div className="spotlight spotlight--r" /><Sparkles /><Flora />
      <div className="cover__inner">
        <span className="cover__milestone" aria-hidden="true">{EVENT.milestone}</span>
        <h1 className="cover__title" style={{ fontSize: `min(${Math.min(25, 86 / (Math.max(EVENT.firstName.length, 4) * 0.66)).toFixed(1)}vw, 17rem)` }}><em>{EVENT.title}</em>{EVENT.firstName}</h1>
        <div className="cover__bottom">
          <p className="cover__headline">{EVENT.headline}</p>
          <p className="cover__meta">{EVENT.milestoneLabel}<br />{EVENT.dateDisplay} · {EVENT.timeDisplay}</p>
        </div>
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}><span className="cue">Scroll</span></div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ invitation + details */
/** Google Calendar link for the "Add to calendar" button (venue, dress code, program, map link in the details). */
function googleCalendarUrl() {
  const s = new Date(EVENT.dateISO); if (Number.isNaN(s.getTime())) return "";
  const e = new Date(s.getTime() + EVENT.calendarDurationHours * 36e5);
  const f = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const details = [`Venue: ${EVENT.venueName}`, EVENT.address, `Dress code: ${EVENT.dressCode}`, `Kindly reply by: ${EVENT.rsvpDeadline}`, "", "Program:",
    ...PROGRAM.map((p) => `${p.time}  ${p.title}`), EVENT.mapLink ? `\nMap: ${EVENT.mapLink}` : ""].join("\n");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${EVENT.debutante} · ${EVENT.title}`)}&dates=${f(s)}/${f(e)}&location=${encodeURIComponent(`${EVENT.venueName}, ${EVENT.address}`)}&details=${encodeURIComponent(details)}`;
}

/** Google map preview. The iframe is mounted only after the card has finished its reveal animation:
 *  maps loaded inside a hidden/moving box measure the wrong size and draw only part of the map. */
function MapEmbed() {
  const box = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState("");
  useEffect(() => {
    const el = box.current; if (!el) return;
    let t = 0;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { t = window.setTimeout(() => setSrc(EVENT.mapEmbed), 1100); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, []);
  return <div className="map" ref={box}>{src && <iframe src={src} title="Venue map" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}
    {/^https?:\/\//.test(EVENT.mapLink) && <a className="map__open" href={EVENT.mapLink} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>}</div>;
}

function Details() {
  const [copied, setCopied] = useState(false);
  const cd = useCountdown(EVENT.dateISO);
  const gcal = useMemo(googleCalendarUrl, []);
  const hasAddr = EVENT.address.trim().length > 0;
  const hasMap = /^https?:\/\//.test(EVENT.mapLink);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${EVENT.venueName}, ${EVENT.address}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt("Copy the address:", `${EVENT.venueName}, ${EVENT.address}`); }
  };
  return (<>
    <section id="invitation" aria-labelledby="inv-t">
      <Flora />
      <div className="section invite has-flora-top">
        <div className="reveal">
          <p className="kicker">You are invited</p>
          <h2 className="h2" id="inv-t">The night <em>she</em> steps into the light</h2>
          <p className="lead">{EVENT.invitation}</p>
        </div>
        <div className="invite__side reveal">
          <Ornament />
          <p className="pull">{EVENT.description}</p>
          <p className="body">{EVENT.rsvpInstructions}</p>
        </div>
      </div>
    </section>
    <Section id="details" kicker="Save the date" title={<>The <em>details</em></>} band center>
      <div className="when reveal">
        <span className="sr-only">{EVENT.dateDisplay}, {EVENT.timeDisplay}</span>
        <div className="when__day" aria-hidden="true">{EVENT.day}</div>
        <div className="when__txt" aria-hidden="true"><span>{EVENT.month}</span><span>{EVENT.year}</span><b>{EVENT.weekday} · {EVENT.timeDisplay}</b></div>
      </div>
      {gcal && <div className="detail__actions when__cal reveal">
        <a className="btn btn--ghost btn--sm" href={gcal} target="_blank" rel="noopener noreferrer">Add to calendar</a>
      </div>}
      {cd.valid && (cd.done ? <p className="cd-done">Tonight is the night ✦</p> :
        <div className="countdown reveal" role="timer" aria-label="Countdown to the event">
          {([["Days", cd.d], ["Hours", cd.h], ["Mins", cd.m], ["Secs", cd.s]] as const).map(([l, v]) =>
            <div className="cd" key={l}><b key={v}>{pad(v)}</b><span>{l}</span></div>)}
        </div>)}
      <div className="venue reveal">
        <div className="venue__in">
          <p className="venue__k">The venue</p>
          <h3>{EVENT.venueName}</h3>
          {hasAddr && <p className="addr">{EVENT.address}</p>}
          {(hasAddr || hasMap) && <div className="detail__actions">
            {hasAddr && <button className="btn btn--ghost btn--sm" onClick={copy} aria-live="polite">{copied ? "Copied ✓" : "Copy address"}</button>}
            {hasMap && <a className="btn btn--ghost btn--sm" href={EVENT.mapLink} target="_blank" rel="noopener noreferrer">Open map</a>}
          </div>}
        </div>
        {EVENT.mapEmbed && <MapEmbed />}
      </div>
      <div className="replyby reveal"><p>Kindly reply by<b>{EVENT.rsvpDeadline}</b></p><button className="btn btn--sm" onClick={() => goTo("seat")}>RSVP · Find my seat</button></div>
    </Section>
  </>);
}

/* ------------------------------------------------------------ story timeline, carousel, video */
const Story = () => (
  <Section id="story" kicker="The story" title={<>Her <em>story</em></>} flora>
    <div className="story">{STORY.map((s) => (
      <article className="st reveal" key={s.year}>
        <div className="st__txt"><div className="st__year">{s.year}</div><h3>{s.title}</h3><p>{s.text}</p></div>
        <div className="st__pics"><Photo n={s.photos[0]} frame alt={s.title} className="st__big" /><Photo n={s.photos[1]} frame alt="" className="st__small" /></div>
      </article>))}
    </div>
  </Section>
);

function Carousel() {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const drag = useRef({ down: false, x: 0, left: 0 });
  useEffect(() => {  // auto-slides every 3s; swipe or drag any time
    const el = ref.current; if (!el || reduced()) return;
    const t = setInterval(() => {
      if (paused.current) return;
      const pl = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const next = (Array.from(el.children) as HTMLElement[]).find((k) => k.offsetLeft - el.scrollLeft > pl + 24);
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({ left: end || !next ? 0 : next.offsetLeft - pl, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(t);
  }, []);
  const hold = (v: boolean, delay = 0) => () => { setTimeout(() => { paused.current = v; }, delay); };
  const up = () => { drag.current.down = false; if (ref.current) ref.current.style.scrollSnapType = ""; hold(false, 2000)(); };
  return (
    <section className="carousel-band" aria-label="Photo carousel">
      <div className="strip" ref={ref} tabIndex={0}
        onMouseEnter={hold(true)} onMouseLeave={hold(false)} onTouchStart={hold(true)} onTouchEnd={hold(false, 2500)} onFocus={hold(true)} onBlur={hold(false)}
        onPointerDown={(e) => { if (e.pointerType !== "mouse" || !ref.current) return; drag.current = { down: true, x: e.clientX, left: ref.current.scrollLeft }; ref.current.style.scrollSnapType = "none"; }}
        onPointerMove={(e) => { if (drag.current.down && ref.current) ref.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x); }}
        onPointerUp={up} onPointerLeave={up}>
        {MEDIA.carousel.map((n, i) => <Photo key={`${n}-${i}`} n={n} alt={`${EVENT.firstName} photo ${i + 1}`} />)}
      </div>
    </section>
  );
}

function Video() {
  const [ok, setOk] = useState(Boolean(MEDIA.video));
  if (!ok) return null;
  return (
    <Section id="film" kicker="The film" title={<>Watch <em>her story</em></>}>
      <div className="film reveal"><video src={MEDIA.video} poster={PHOTO(MEDIA.videoPoster)} controls playsInline preload="metadata" onError={() => setOk(false)}>Your browser can't play this video.</video></div>
    </Section>
  );
}

const Program = () => (
  <Section id="program" kicker="Run of show" title={<>The <em>program</em></>} band>
    <ol className="timeline reveal">{PROGRAM.map((p) =>
      <li className="tline" key={p.time + p.title}><time>{p.time}</time><div><h3>{p.title}</h3>{"note" in p && p.note ? <p>{p.note}</p> : null}</div></li>)}</ol>
  </Section>
);

/* ------------------------------------------------------------ attire + entourage */
function Attire() {
  const [g, setG] = useState(0);
  const grp = ATTIRE.groups[g];
  return (
    <Section id="attire" kicker="Dress code" title={<>Attire <em>guide</em></>} flora center>
      <div className="tabs" role="tablist" aria-label="Attire groups">
        {ATTIRE.groups.map((x, i) => <button key={x.id} role="tab" aria-selected={g === i} onClick={() => setG(i)}>{x.title}</button>)}
      </div>
      <div className="at-body" key={grp.id}>
        {[grp.men, grp.women].map((p) => (
          <figure key={p.label} className="at-fig">
            <Slot flow src={p.image} ar="3/5" alt={`${grp.title} attire for ${p.label.toLowerCase()}`} />
            <figcaption><b>{p.label}</b><span>{p.note}</span></figcaption>
          </figure>))}
      </div>
      <div className="swatches" aria-label="Color palette">{ATTIRE.colors.map((c) => <div key={c.name} className="sw"><i style={{ background: c.hex }} /><span>{c.name}</span></div>)}</div>
      <div className="at-rules reveal"><p className="at-strict">{ATTIRE.strict}</p>
        <p className="kicker" style={{ marginTop: "1.4rem" }}>Please do not wear</p>
        <ul>{ATTIRE.avoid.map((a) => <li key={a}>{a}</li>)}</ul></div>
    </Section>
  );
}
const Entourage = () => (
  <Section id="entourage" kicker="With love" title={<>The <em>entourage</em></>} band center>
    <div className="en-parents reveal"><p className="en-role">Her parents</p>{ENTOURAGE.parents.map((n) => <p className="en-name" key={n}>{n}</p>)}</div>
    <div className="en-sponsors reveal"><h3>Sponsors</h3><div className="en-names en-names--c">{ENTOURAGE.sponsors.map((n) => <p className="en-name" key={n}>{n}</p>)}</div></div>
    <div className="en-grid">{ENTOURAGE.groups.map((gr) => (
      <div className="en-grp reveal" key={gr.title}><h3>{gr.title}</h3>{gr.note && <p className="en-role">{gr.note}</p>}
        <div className="en-names">{gr.names.map((n, i) => <p className="en-name" key={`${n}-${i}`}>{n}</p>)}</div></div>))}
    </div>
  </Section>
);

function Gifts() {
  const [copied, setCopied] = useState("");
  const copy = async (name: string, num: string) => {
    try { await navigator.clipboard.writeText(num.replace(/\s/g, "")); setCopied(name); setTimeout(() => setCopied(""), 2000); }
    catch { window.prompt("Copy the number:", num); }
  };
  if (!GIFTS.options.length) return null;
  return (
    <Section id="gifts" kicker="With gratitude" title={<>Gift <em>guide</em></>} flora center>
      <p className="body reveal" style={{ marginInline: "auto" }}>{GIFTS.message}</p>
      <div className="gifts">{GIFTS.options.map((o) => (
        <div className="gift reveal" key={o.name}>
          <Slot flow src={o.qr} ar="1/1" className="gift__qr" alt={`${o.name} QR code`} />
          <h3>{o.name}</h3><p>{o.accountName}</p>
          {o.number && <button className="btn btn--ghost btn--sm" onClick={() => copy(o.name, o.number)} aria-live="polite">{copied === o.name ? "Copied ✓" : `Copy ${o.number}`}</button>}
        </div>))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ SMART RSVP + SEAT FINDER */
type Phase = "idle" | "searching" | "choose" | "none" | "result" | "error";
function Finder({ onReveal }: { onReveal: () => void }) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("");
  const [matches, setMatches] = useState<GuestMatch[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [rsvp, setRsvp] = useState<RsvpStatus>("pending");
  const [sent, setSent] = useState("");
  const [saving, setSaving] = useState(false);
  const [ticketBlob, setTicketBlob] = useState<Blob | null>(null);
  const req = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  const pick = async (id: string, rid = ++req.current) => {
    setPhase("searching");
    try {
      const g = await getGuest(id);
      if (rid !== req.current) return;
      if (!g) { setNote("We couldn't load that invitation. Please try again."); setPhase("error"); return; }
      setGuest(g); setRsvp(g.rsvp); setPhase("result"); onReveal();
    } catch { setNote("Something went wrong. Please try again."); setPhase("error"); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.replace(/\s+/g, " ").trim();
    if (!q) { setNote("Please type your name first."); setPhase("error"); input.current?.focus(); return; }
    const rid = ++req.current;
    setPhase("searching"); setMatches([]);
    try {
      const found = await lookupGuests(q);
      if (rid !== req.current) return;
      if (!found.length) setPhase("none");
      else if (found.length === 1) await pick(found[0].id, rid);
      else { setMatches(found); setPhase("choose"); }
    } catch { setNote("Something went wrong. Please try again."); setPhase("error"); }
  };
  const reset = () => { req.current++; setSent(""); setQuery(""); setPhase("idle"); setMatches([]); setGuest(null); setNote(""); setTimeout(() => input.current?.focus(), 50); };

  const reply = async (s: RsvpStatus) => {
    if (!guest) return; setRsvp(s); if (s === "attending") onReveal();
    try { await sendReply({ guestId: guest.id, name: guest.fullName, status: s }); setSent(!API.endpoint ? "Saved in this browser (demo)." : s === "attending" ? "Yay, see you there! Your reply was submitted." : "We'll miss you. Your reply was submitted."); }
    catch { setSent("Could not send. Please tell the host directly."); }
  };
  return (
    <section id="seat" aria-labelledby="seat-t">
      <div className="section">
        <div className="finder reveal">
          <Marquee n={22} />
          <p className="kicker" style={{ marginTop: "1.5rem" }}>Smart RSVP</p>
          <h2 className="h2" id="seat-t">Find <em>your seat</em></h2>

          {phase !== "result" && (<>
            <p className="body">{EVENT.rsvpInstructions}</p>
            <form className="finder__form" onSubmit={submit} noValidate>
              <label className="sr-only" htmlFor="guest-name">Your full name</label>
              <input id="guest-name" ref={input} className="field" value={query} autoComplete="off" autoCapitalize="words"
                placeholder="Type your full name" onChange={(e) => setQuery(e.target.value)} disabled={phase === "searching"} />
              <button className="btn" type="submit" disabled={phase === "searching"}>Find my seat</button>
              {(query || phase !== "idle") && <button className="btn btn--ghost" type="button" onClick={reset}>Clear</button>}
            </form>
            <div aria-live="polite">
              {phase === "searching" && <p className="msg"><span className="spinner" />Searching the guest list…</p>}
              {phase === "error" && <p className="msg msg--error" role="alert">{note}</p>}
              {phase === "none" && <p className="msg">We couldn't find that name. Try your full name as written on the invitation, check the spelling, or ask the host for help.</p>}
            </div>
            {phase === "choose" && (<>
              <p className="msg">More than one guest has that name. Please choose yours:</p>
              <ul className="matches">{matches.map((m) => <li key={m.id}><button onClick={() => pick(m.id)}>
                <span>{m.fullName}</span><small>{m.hint ?? "Select"}</small></button></li>)}</ul>
            </>)}
          </>)}

          {phase === "result" && guest && (
            <div className="result" aria-live="polite">
              <article className="ticket" aria-label="Your seat ticket">
                <div className="ticket__brand"><span>{EVENT.title}</span><span>Admit {guest.partySize && guest.partySize > 1 ? `· Party of ${guest.partySize}` : "One"}</span></div>
                <h3 className="ticket__name">{guest.fullName}</h3>
                <p className="ticket__welcome">{EVENT.welcome.replace("{name}", guest.fullName.split(" ")[0])}</p>
                <div className="ticket__nums">
                  <div className="ticket__num"><small>Table</small><b>{guest.table}</b></div>
                  <div className="ticket__num"><small>Seat</small><b>{guest.seat}</b></div>
                </div>
                <div className="ticket__row">
                  <span className={`status status--${rsvp}`}>{STATUS_LABEL[rsvp]}</span>
                  <span>{EVENT.title}</span><span>{EVENT.dateDisplay} · {EVENT.timeDisplay}</span><span>{EVENT.venueName}</span>
                </div>
                <dl className="ticket__sum">
                  <div><dt>Venue</dt><dd>{EVENT.venueName}<br />{EVENT.address}</dd></div>
                  <div><dt>Dress code</dt><dd>{EVENT.dressCode}</dd></div>
                  <div><dt>Program</dt><dd>{PROGRAM.map((p) => <span key={p.time + p.title}>{p.time} · {p.title}</span>)}</dd></div>
                </dl>
              </article>

              <div className="rsvp-demo">
                <strong>Will you be joining us?</strong>
                <div className="rsvp-demo__btns">
                  {(["attending", "declined"] as RsvpStatus[]).map((s) =>
                    <button key={s} className="btn btn--ghost btn--sm" aria-pressed={rsvp === s} onClick={() => reply(s)}>
                      {s === "attending" ? "Yes, I'll be there" : "Sorry, I can't make it"}</button>)}
                  {EVENT.contact.href && <a className="btn btn--sm" href={EVENT.contact.href} target="_blank" rel="noopener noreferrer">{EVENT.contact.label}</a>}
                </div>
                {sent && <p className="fine" role="status" style={{ marginTop: ".8rem" }}>{sent}</p>}
                {!API.endpoint && <p className="fine">Demo mode: replies stay in this browser until a Google Sheet is connected (see data.ts).</p>}
              </div>
              <div className="result__actions">
                <button className="btn" disabled={saving} onClick={async () => { setSaving(true); try { const b = await renderTicketBlob(guest, rsvp); if (b) setTicketBlob(b); else setSent("Could not prepare the picture. Please screenshot your ticket instead."); } catch { setSent("Could not prepare the picture. Please screenshot your ticket instead."); } finally { setSaving(false); } }}>{saving ? "Preparing…" : "Save ticket"}</button>
                <button className="btn btn--ghost" onClick={() => goTo("invitation")}>Back to invitation</button>
                <button className="btn btn--ghost" onClick={reset}>Search again</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {ticketBlob && guest && <TicketModal blob={ticketBlob} name={guest.fullName} onClose={() => setTicketBlob(null)} />}
    </section>
  );
}


/* ------------------------------------------------------------ SCRATCH CARD */
function ScratchCard({ onWin }: { onWin: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef(0);
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [pct, setPct] = useState(0);

  const paint = useCallback(() => {
    const c = canvas.current, w = wrap.current; if (!c || !w) return;
    const { width, height } = w.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(width * dpr); c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, THEME.secondary); g.addColorStop(0.3, THEME.primary); g.addColorStop(0.5, THEME.accent);
    g.addColorStop(0.7, THEME.primary); g.addColorStop(1, THEME.secondary);
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1;
    for (let i = -height; i < width; i += 9) { ctx.beginPath(); ctx.moveTo(i, height); ctx.lineTo(i + height, 0); ctx.stroke(); }
    ctx.strokeStyle = THEME.accent; ctx.strokeRect(8, 8, width - 16, height - 16);
  }, []);

  useEffect(() => {
    paint();
    const w = wrap.current; if (!w) return;
    let lastW = w.clientWidth;
    const ro = new ResizeObserver(() => { if (w.clientWidth !== lastW && !doneRef.current) { lastW = w.clientWidth; paint(); setPct(0); setStarted(false); } });
    ro.observe(w);
    return () => { ro.disconnect(); cancelAnimationFrame(raf.current); };
  }, [paint]);

  const measure = () => {
    raf.current = 0;
    const c = canvas.current, ctx = c?.getContext("2d"); if (!c || !ctx || doneRef.current) return;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const step = 16; let clear = 0, total = 0;
    for (let i = 3; i < data.length; i += 4 * step) { total++; if (data[i] < 128) clear++; }
    const p = clear / total; setPct(p);
    if (p > 0.5) reveal();
  };
  const reveal = () => { if (doneRef.current) return; doneRef.current = true; setDone(true); setPct(1); onWin(); };
  const pos = (e: RPointerEvent) => { const r = canvas.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e: RPointerEvent<HTMLCanvasElement>) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = pos(e); setStarted(true); scratch(e); };
  const scratch = (e: RPointerEvent<HTMLCanvasElement>) => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.globalCompositeOperation = "destination-out"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = 38; ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke();
    last.current = p;
    if (!raf.current) raf.current = requestAnimationFrame(measure);
  };
  const up = () => { last.current = null; };
  const again = () => { doneRef.current = false; setDone(false); setStarted(false); setPct(0); requestAnimationFrame(paint); };

  return (
    <div className="stage">
      <div className={`scratch${started ? " is-started" : ""}`} ref={wrap}>
        <div className="scratch__prize" aria-live="polite"><Photo n={MEDIA.scratchPhoto} fill alt={`${EVENT.debutante}`} /><p className="scratch__cap">{done ? SCRATCH.caption : ""}</p></div>
        <canvas ref={canvas} className={done ? "is-done" : ""} onPointerDown={down}
          onPointerMove={(e) => last.current && scratch(e)} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
          aria-label="Scratch surface. Use the reveal button for a keyboard-friendly option." />
        <span className="scratch__tag" aria-hidden="true">{SCRATCH.heading}</span>
      </div>
      <div className="progress" aria-hidden="true"><i style={{ width: `${Math.min(100, (pct / 0.5) * 100)}%` }} /></div>
      <p className="fine" style={{ marginTop: 0 }}>{SCRATCH.hint}</p>
      <div className="cover__cta" style={{ justifyContent: "center" }}>
        {!done && <button className="btn btn--ghost btn--sm" onClick={reveal}>Reveal without scratching</button>}
        {done && <button className="btn btn--sm" onClick={again}>Scratch again</button>}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------ WORD SEARCH */
function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function buildPuzzle(words: string[], size: number) {
  const n = Math.max(size, ...words.map((w) => w.length));
  let seed = 7; words.join("|").split("").forEach((ch) => (seed = (seed * 31 + ch.charCodeAt(0)) | 0));
  const rnd = mulberry(seed);
  const grid: string[] = Array(n * n).fill("");
  const dirs = [[0, 1], [1, 0], [1, 1]];
  words.forEach((w) => {
    for (let t = 0; t < 400; t++) {
      const [dr, dc] = dirs[Math.floor(rnd() * dirs.length)];
      const r = Math.floor(rnd() * n), c = Math.floor(rnd() * n);
      if (r + dr * (w.length - 1) >= n || c + dc * (w.length - 1) >= n) continue;
      let ok = true;
      for (let i = 0; i < w.length; i++) { const ch = grid[(r + dr * i) * n + c + dc * i]; if (ch && ch !== w[i]) { ok = false; break; } }
      if (!ok) continue;
      for (let i = 0; i < w.length; i++) grid[(r + dr * i) * n + c + dc * i] = w[i];
      break;
    }
  });
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return { n, cells: grid.map((ch) => ch || A[Math.floor(rnd() * 26)]) };
}
function WordSearch({ onWin }: { onWin: () => void }) {
  const words = useMemo(() => WORDSEARCH.questions.map((q) => q.answer.toUpperCase().replace(/[^A-Z]/g, "")), []);
  const { n, cells } = useMemo(() => buildPuzzle(words, WORDSEARCH.gridSize), [words]);
  const [start, setStart] = useState<number | null>(null);
  const [foundCells, setFoundCells] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<number[]>([]);
  const [msg, setMsg] = useState("Tap the first letter, then the last letter of the word.");
  const won = foundWords.length === words.length;
  useEffect(() => { if (won) onWin(); /* eslint-disable-next-line */ }, [won]);

  const tap = (idx: number) => {
    if (won) return;
    if (start === null) { setStart(idx); setMsg("Now tap the last letter."); return; }
    if (start === idx) { setStart(null); setMsg("Selection cleared."); return; }
    const r1 = Math.floor(start / n), c1 = start % n, r2 = Math.floor(idx / n), c2 = idx % n;
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    const aligned = r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1);
    setStart(null);
    if (!aligned) { setMsg("Letters must be in a straight line. Try again."); return; }
    const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1;
    const path = Array.from({ length: len }, (_, i) => (r1 + dr * i) * n + c1 + dc * i);
    const s = path.map((i) => cells[i]).join(""), rs = [...s].reverse().join("");
    const qi = words.findIndex((w, i) => !foundWords.includes(i) && (w === s || w === rs));
    if (qi < 0) { setMsg("Not a match. Keep looking!"); return; }
    setFoundCells((f) => [...f, ...path]); setFoundWords((f) => [...f, qi]); setMsg(`Found ${words[qi]}!`);
  };
  const reset = () => { setStart(null); setFoundCells([]); setFoundWords([]); setMsg("Tap the first letter, then the last letter of the word."); };

  return (<>
    <p className="body">{WORDSEARCH.intro}</p>
    <div className="ws">
      <div>
        <div className="ws__grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="group" aria-label="Word search puzzle">
          {cells.map((ch, i) => (
            <button key={i} className={`ws__cell${foundCells.includes(i) ? " is-found" : ""}${start === i ? " is-picked" : ""}`}
              onClick={() => tap(i)} aria-label={`Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}, ${ch}`}>{ch}</button>
          ))}
        </div>
      </div>
      <div>
        <ol className="ws__qs">{WORDSEARCH.questions.map((q, i) => (
          <li key={q.question} className={foundWords.includes(i) ? "is-done" : ""}><p>{q.question}</p>
            {foundWords.includes(i) && <span className="answer">{words[i]}</span>}</li>))}</ol>
        <p className="msg" aria-live="polite">{won ? WORDSEARCH.complete : msg}</p>
        <div className="result__actions"><button className="btn btn--ghost btn--sm" onClick={reset}>Reset puzzle</button></div>
      </div>
    </div>
  </>);
}


/* ------------------------------------------------------------ ADMIN  (open with  yoursite.com/#admin ) */
/** Prev / numbered / Next pager used in the admin lists. */
function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (n: number) => void }) {
  if (pages <= 1) return <p className="fine" style={{ marginTop: ".6rem" }}>{total} total</p>;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="pager" aria-label="Pagination">
      <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span className="pager__nums">{nums.map((n, i) => (
        <span key={n}>{i > 0 && n - nums[i - 1] > 1 && <em>…</em>}
          <button className="pager__n" aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>{n}</button></span>))}</span>
      <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
      <small>{total} total</small>
    </nav>
  );
}
type Row = Guest;
const blank = (): Row => ({ id: `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, fullName: "", table: "", seat: "", rsvp: "pending", partySize: 1 });
const readLS = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } };
function Admin({ onClose }: { onClose: () => void }) {
  const live = Boolean(API.endpoint);
  const [ok, setOk] = useState(false), [pin, setPin] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"guests" | "attendees" | "replies">("guests");
  const [rows, setRows] = useState<Row[]>(() => readLS<Row[]>(GUESTS_KEY, GUESTS));
  const [replies, setReplies] = useState<Record<string, unknown>[]>([]);
  const [q, setQ] = useState(""), [bulk, setBulk] = useState(""), [toast, setToast] = useState("");
  const [page, setPage] = useState(1), [rpage, setRpage] = useState(1);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2400); return () => clearTimeout(t); }, [toast]);

  const load = async (p: string) => {
    setBusy(true); setErr("");
    try {
      if (live) {
        const r = await (await fetch(`${API.endpoint}?action=all&pin=${encodeURIComponent(p)}`)).json();
        if (r.error) { setErr("Wrong passcode. It must match the PIN in your Apps Script."); return false; }
        setRows(r.guests ?? []); setReplies(r.replies ?? []);
      } else setReplies(readLS<Record<string, unknown>[]>(REPLIES_KEY, []));
      return true;
    } catch { setErr("Could not connect. Check API.endpoint in data.ts."); return false; } finally { setBusy(false); }
  };
  const unlock = async (e: React.FormEvent) => {
    e.preventDefault(); const p = pin.trim();
    if (!live && p !== API.adminPin) { setErr("Wrong passcode (demo PIN is in data.ts → API.adminPin)."); return; }
    if (await load(p)) setOk(true);
  };
  const upd = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const clean = () => rows.map((r) => ({ ...r, fullName: r.fullName.trim(), table: r.table.trim(), seat: r.seat.trim() })).filter((r) => r.fullName);
  const save = async () => {
    const list = clean(); setRows(list);
    try {
      if (live) await fetch(API.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "saveGuests", pin: pin.trim(), guests: list }) });
      else localStorage.setItem(GUESTS_KEY, JSON.stringify(list));
      setToast(live ? "Sent to your Google Sheet" : "Saved in this browser (demo)");
    } catch { setToast("Save failed"); }
  };
  const addBulk = () => {   // one guest per line:  Full Name, Table, Seat
    const add = bulk.split("\n").map((l) => l.split(",").map((s) => s.trim())).filter((p) => p[0])
      .map((p) => ({ ...blank(), fullName: p[0], table: p[1] ?? "", seat: p[2] ?? "" }));
    setRows([...rows, ...add]); setBulk(""); setToast(`${add.length} added. Press Save.`);
  };
  const csv = (only = false) => {
    const list = only ? rows.filter((r) => r.rsvp === "attending") : rows;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const out = [["Name", "Table", "Seat", "RSVP", "Party"], ...list.map((r) => [r.fullName, r.table, r.seat, r.rsvp, r.partySize ?? 1])].map((r) => r.map(esc).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out], { type: "text/csv" })); a.download = only ? "final-attendees.csv" : "guest-list.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const attending = rows.filter((r) => r.rsvp === "attending");
  const byTable = attending.reduce<Record<string, Row[]>>((m, r) => { (m[r.table || "—"] ||= []).push(r); return m; }, {});
  const tables = Object.keys(byTable).sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
  const bySeat = (l: Row[]) => [...l].sort((x, y) => x.seat.localeCompare(y.seat, undefined, { numeric: true }));
  const copyList = async () => {
    const t = tables.map((k) => `TABLE ${k}\n` + bySeat(byTable[k]).map((r) => `  ${r.seat}. ${r.fullName}${(r.partySize || 1) > 1 ? ` (+${(r.partySize || 1) - 1})` : ""}`).join("\n")).join("\n\n");
    try { await navigator.clipboard.writeText(t); setToast("Final list copied"); } catch { setToast("Copy failed"); }
  };
  const count = (s: RsvpStatus) => rows.filter((r) => r.rsvp === s).reduce((n, r) => n + (r.partySize || 1), 0);

  if (!ok) return (
    <main className="admin"><div className="admin__bar"><h1>Admin</h1><button className="btn btn--ghost btn--sm" onClick={onClose}>← Back to invitation</button></div>
      <form onSubmit={unlock} className="finder__form"><label className="sr-only" htmlFor="pin">Passcode</label>
        <input id="pin" className="field" type="password" value={pin} placeholder="Passcode" onChange={(e) => setPin(e.target.value)} autoComplete="off" />
        <button className="btn" disabled={busy}>{busy ? "Checking…" : "Unlock"}</button></form>
      {err && <p className="msg msg--error" role="alert">{err}</p>}
      <p className="fine">{live ? "Connected to Google Sheets." : "Demo mode: edits are stored in this browser only. Connect a Google Sheet (API.endpoint in data.ts) to share data across devices."}</p></main>
  );
  const filtered = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.fullName.toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE)), cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * ADMIN_PAGE_SIZE, cur * ADMIN_PAGE_SIZE);
  const rPages = Math.max(1, Math.ceil(replies.length / ADMIN_PAGE_SIZE)), rCur = Math.min(rpage, rPages);
  const rShown = replies.slice((rCur - 1) * ADMIN_PAGE_SIZE, rCur * ADMIN_PAGE_SIZE);
  return (
    <main className="admin">
      <div className="admin__bar"><h1>Guest admin</h1>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}><button className="btn btn--ghost btn--sm" onClick={() => csv()}>Export CSV</button><button className="btn btn--ghost btn--sm" onClick={() => load(pin)}>Refresh</button><button className="btn btn--ghost btn--sm" onClick={onClose}>← Invitation</button></div></div>
      <div className="stats">{([["Guests", rows.length], ["Attending", count("attending")], ["Pending", count("pending")], ["Declined", count("declined")]] as const).map(([l, v]) => <div className="stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
      <div className="tabs" role="tablist"><button role="tab" aria-selected={tab === "guests"} onClick={() => setTab("guests")}>Guests & seats</button><button role="tab" aria-selected={tab === "attendees"} onClick={() => setTab("attendees")}>Final attendees ({attending.length})</button><button role="tab" aria-selected={tab === "replies"} onClick={() => setTab("replies")}>Replies ({replies.length})</button></div>
      {tab === "guests" ? (<>
        <input className="field" style={{ width: "100%", marginBottom: "1rem", fontSize: "1.1rem" }} placeholder="Search guests…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search guests" />
        {shown.map(({ r, i }) => (
          <div className="arow" key={r.id}>
            <input className="in wide" value={r.fullName} placeholder="Full name" aria-label="Full name" onChange={(e) => upd(i, { fullName: e.target.value })} />
            <input className="in" value={r.hint ?? ""} placeholder="Hint (duplicates)" aria-label="Hint" onChange={(e) => upd(i, { hint: e.target.value })} />
            <input className="in" value={r.table} placeholder="Table" aria-label="Table" onChange={(e) => upd(i, { table: e.target.value })} />
            <input className="in" value={r.seat} placeholder="Seat" aria-label="Seat" onChange={(e) => upd(i, { seat: e.target.value })} />
            <select className="in" value={r.rsvp} aria-label="RSVP status" onChange={(e) => upd(i, { rsvp: e.target.value as RsvpStatus })}><option value="pending">Pending</option><option value="attending">Attending</option><option value="declined">Declined</option></select>
            <div className="arow__btns"><button className="btn btn--ghost btn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove ${r.fullName || "guest"}`}>Remove</button></div>
          </div>))}
        <Pager page={cur} pages={pages} total={filtered.length} onPage={setPage} />
        <div className="result__actions"><button className="btn btn--ghost" onClick={() => { setRows([...rows, blank()]); setQ(""); setPage(Math.ceil((rows.length + 1) / ADMIN_PAGE_SIZE)); }}>+ Add guest</button><button className="btn" onClick={save}>Save changes</button></div>
        <p className="kicker" style={{ marginTop: "2.5rem" }}>Bulk add</p>
        <textarea className="field" style={{ width: "100%", minHeight: 120, fontSize: "1rem" }} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"One per line: Full Name, Table, Seat\nAna Cruz, 03, 5"} aria-label="Bulk add guests" />
        <div className="result__actions"><button className="btn btn--ghost" onClick={addBulk} disabled={!bulk.trim()}>Add lines</button></div>
      </>) : tab === "attendees" ? (
        <div>
          <div className="result__actions" style={{ marginTop: 0 }}><button className="btn btn--sm" onClick={copyList}>Copy list</button><button className="btn btn--ghost btn--sm" onClick={() => csv(true)}>Export CSV</button></div>
          <p className="fine">Final attendees = guests marked “Attending” ({count("attending")} seats from {attending.length} replies), grouped by table.</p>
          {attending.length === 0 && <p className="msg">No confirmed attendees yet.</p>}
          <div className="att-grid">{tables.map((k) => (
            <div className="att" key={k}><h3>Table {k}<small>{byTable[k].reduce((n, r) => n + (r.partySize || 1), 0)} guests</small></h3>
              <ol>{bySeat(byTable[k]).map((r) => <li key={r.id}><span>{r.seat}</span>{r.fullName}{(r.partySize || 1) > 1 && <em> +{(r.partySize || 1) - 1}</em>}</li>)}</ol></div>))}</div>
        </div>
      ) : (
        <div className="replies">{replies.length === 0 && <p className="msg">No replies yet.</p>}
          {rShown.map((r, i) => <div className="reply" key={i}><b>{String(r.name ?? r.family ?? "Guest")}</b> — {String(r.status ?? r.attending ?? "")}<br /><small>{String(r.submittedAt ?? r.date ?? "")}</small></div>)}
          <Pager page={rCur} pages={rPages} total={replies.length} onPage={setRpage} /></div>)}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

/* ------------------------------------------------------------ APP */
export default function App() {
  const music = useMusic();
  const confetti = useConfetti();
  const [opened, setOpened] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [admin, setAdmin] = useState(() => window.location.hash === "#admin");

  useEffect(() => {  // theme from data.ts → CSS variables
    const s = document.documentElement.style;
    s.setProperty("--color-primary", THEME.primary); s.setProperty("--color-secondary", THEME.secondary);
    s.setProperty("--color-accent", THEME.accent); s.setProperty("--color-background", THEME.background);
    s.setProperty("--color-text", THEME.text); s.setProperty("--font-display", THEME.displayFont); s.setProperty("--font-body", THEME.bodyFont);
    s.setProperty("--fl-left", String(FLOWER_SCALE.left)); s.setProperty("--fl-right", String(FLOWER_SCALE.right));
    document.title = `${EVENT.title} — ${EVENT.debutante}`;
  }, []);
  useEffect(() => { const h = () => setAdmin(window.location.hash === "#admin"); window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  useEffect(() => { document.body.classList.toggle("lock", !opened && !admin); }, [opened, admin]);
  useEffect(() => {  // scroll reveal
    if (admin) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [admin]);
  useEffect(() => { if (!flashKey) return; const t = setTimeout(() => setFlashKey(0), 950); return () => clearTimeout(t); }, [flashKey]);
  const flash = useCallback(() => { if (!reduced()) setFlashKey(Date.now()); }, []);
  const celebrate = useCallback(() => { flash(); confetti.fire(); }, [flash, confetti.fire]);

  if (admin) return <Admin onClose={() => { window.location.hash = ""; setAdmin(false); }} />;
  return (
    <>
      <div className="grain" aria-hidden="true" />
      {flashKey > 0 && <div className="flash" key={flashKey} aria-hidden="true" />}
      {confetti.node}
      <div className="yt-hidden" ref={music.host} aria-hidden="true" />
      <Envelope onStart={() => { music.play(); }} onOpen={() => { window.scrollTo(0, 0); setOpened(true); flash(); }} />
      {opened && <MusicBtn music={music} />}
      <div className={`site${opened ? " revealed" : ""}`} aria-hidden={!opened}>
        <Nav />
        <ScrollProgress />
        {opened && PETALS.enabled && <Petals />}
        <main>
          <Cover />
          <Marquee n={34} />
          <Details />
          <Story />
          <Carousel />
          <Video />
          <Finder onReveal={celebrate} />
          <Program />
          <Attire />
          <Entourage />
          <Gifts />
          <Section id="play" kicker="Little surprises" title={<>Scratch <em>&amp; reveal</em></>}>
            <ScratchCard onWin={celebrate} />
          </Section>
          <Section id="wordsearch" kicker="The debut quiz" title={WORDSEARCH.heading} band>
            <WordSearch onWin={celebrate} />
          </Section>
        </main>
        <footer className="footer">
          <Marquee n={26} />
          <Photo n={MEDIA.closingPhoto} ratio="4/5" className="closing-photo" alt={EVENT.debutante} />
          <h2 className="h2" style={{ marginTop: "2rem" }}>{EVENT.closing}</h2>
          <p>{EVENT.debutante} · {EVENT.dateDisplay}</p>
          <small>{EVENT.hashtag}</small>
        </footer>
      </div>
    </>
  );
}
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import "../styles/dashboard.css"; // side panel + top bar (same as the dashboard)
import "../styles/student-pages.css";

/* ------------------------------------------------------------------
   SAMPLE DATA  (shown only while Supabase is not configured yet)
   With Supabase on, the page calls supabase.rpc("get_registrations"),
   "cancel_registration" and "rate_registration".
------------------------------------------------------------------- */
const SAMPLE_ME = { firstName: "Ruth", lastName: "Tellez", idNumber: "2024-04877" };

const SAMPLE_REGISTRATIONS = [
  { id: 1, title: "Digital Poster Making (SUMBINGTIK)", status: "Registered", rating: null, date: "2026-11-28", time: "13:00", venue: "COMPUTER LAB", hasCert: false },
  { id: 2, title: "Mental Health Awareness Talk", status: "Pending", rating: null, date: "2026-12-16", time: "12:00", venue: "Auditorium", hasCert: false },
  { id: 3, title: "Sports Fest 2026: Open Ceremony", status: "Attended", rating: null, date: "2026-11-20", time: "07:00", venue: "One Arena", hasCert: true },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};
const fmtTime = (t) => {
  // 07:00 -> 7:00AM, 12:00 -> 12:00NN
  const [h, m] = t.split(":").map(Number);
  if (h === 12 && m === 0) return "12:00NN";
  return `${h % 12 || 12}:${pad(m)}${h >= 12 ? "PM" : "AM"}`;
};
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/student-dashboard" },
  { key: "activities", label: "Activities", path: "/student-activity" },
  { key: "registrations", label: "Registrations", path: "/student-reg" },
  { key: "consultation", label: "Consultation", path: "/student-consultation" },
];

/* Printable slip / certificate: opens in a new tab, then Print / Save as PDF */
function openPrintPage(kind, reg, me) {
  const name = `${me.lastName}, ${me.firstName}`;
  const body =
    kind === "slip"
      ? `<div class="box"><h1>One Cainta College</h1><p>Activity Registration Slip</p>
          <div class="big">${esc(reg.title)}</div>
          <table style="margin:0 auto"><tr><th>Student</th><td>${esc(name)} (${esc(me.idNumber)})</td></tr>
          <tr><th>Date</th><td>${esc(fmtDate(reg.date))}</td></tr><tr><th>Time</th><td>${esc(fmtTime(reg.time))}</td></tr>
          <tr><th>Venue</th><td>${esc(reg.venue)}</td></tr><tr><th>Status</th><td>${esc(reg.status)}</td></tr>
          <tr><th>Slip no.</th><td>REG-${String(reg.id).padStart(5, "0")}</td></tr></table></div>`
      : `<div class="box"><h1>One Cainta College</h1><p>Certificate of Participation</p>
          <p>This certifies that</p><div class="big">${esc(`${me.firstName} ${me.lastName}`)}</div>
          <p>attended</p><div class="big">${esc(reg.title)}</div>
          <p>${esc(fmtDate(reg.date))} &bull; ${esc(reg.venue)}</p></div>`;
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${kind === "slip" ? "Registration Slip" : "Certificate"}</title>
<style>body{font-family:Arial,sans-serif;max-width:680px;margin:40px auto;padding:0 20px;color:#111}
h1{color:#241a41;margin-bottom:4px}.box{border:3px double #c69a3d;padding:28px;border-radius:8px;text-align:center}
td{padding:6px 14px 6px 0;text-align:left}th{text-align:left;padding-right:14px;color:#555}
.big{font-size:26px;font-weight:bold;color:#241a41;margin:14px 0}@media print{button{display:none}}</style></head>
<body>${body}<p style="text-align:center"><button onclick="window.print()">Print</button></p></body></html>`);
  win.document.close();
  return true;
}

export default function Registrations() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [me, setMe] = useState(SAMPLE_ME);
  const [list, setList] = useState(isSupabaseConfigured ? [] : SAMPLE_REGISTRATIONS);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null); // { kind: "cancel" | "rate", reg }
  const [stars, setStars] = useState(5);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ text: "", error: false });
  const toastTimer = useRef(null);

  const showToast = (text, error = false) => {
    setToast({ text, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ text: "", error: false }), 2800);
  };

  const load = async () => {
    const { data, error } = await supabase.rpc("get_registrations");
    if (error) showToast(error.message, true);
    else setList(data);
  };

  // Only logged-in students may see this page. Then load their registrations.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!active) return;
      if (!s.session) return navigate("/login", { replace: true });
      const [profile, regs] = await Promise.all([supabase.rpc("get_me"), supabase.rpc("get_registrations")]);
      if (!active) return;
      if (profile.error || !profile.data) {
        await supabase.auth.signOut();
        return navigate("/login", { replace: true });
      }
      setMe(profile.data);
      if (regs.error) showToast(regs.error.message, true);
      else setList(regs.data);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  // Cancel / Rate (the dialog's confirm button)
  const confirmDialog = async () => {
    const { kind, reg } = dialog;
    setSaving(true);
    let failed = "";
    if (isSupabaseConfigured) {
      const { error } =
        kind === "cancel"
          ? await supabase.rpc("cancel_registration", { p_id: reg.id })
          : await supabase.rpc("rate_registration", { p_id: reg.id, p_rating: stars });
      if (error) failed = error.message;
    }
    setSaving(false);
    setDialog(null);
    if (failed) return showToast(failed, true);
    if (kind === "cancel") setList((l) => l.filter((r) => r.id !== reg.id));
    else setList((l) => l.map((r) => (r.id === reg.id ? { ...r, rating: stars } : r)));
    showToast(kind === "cancel" ? "Registration cancelled." : "Thanks for your rating!");
    if (isSupabaseConfigured) load();
  };

  if (checking) return null;

  const fullName = `${me.lastName}, ${me.firstName}`.toUpperCase();
  const q = search.trim().toLowerCase();
  const shown = list.filter((r) => !q || [r.title, r.status, r.venue].join(" ").toLowerCase().includes(q));

  return (
    <div className="dash">
      {/* ---------------- SIDE PANEL (fixed) ---------------- */}
      <aside className="side">
        <div className="side__top">
          {/* School icon */}
          <img className="side__school" src="" alt="OCC logo" />
          <span className="side__name">{fullName}</span>
        </div>

        <nav className="side__nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`side__btn${item.key === "registrations" ? " side__btn--active" : ""}`}
              aria-current={item.key === "registrations" ? "page" : undefined}
              onClick={() => item.key !== "registrations" && navigate(item.path)}
            >
              {/* nav icon */}
              <img className="side__icon" src="" alt="" />
              <span className="side__label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="side__bottom">
          <div className="side__profile">
            {/* Profile icon */}
            <img className="side__avatar" src="" alt="Profile" />
            <div className="side__profile-text">
              <strong>{fullName}</strong>
              <span>{me.idNumber}</span>
            </div>
          </div>
          <button type="button" className="side__logout" onClick={handleLogout}>
            <span className="side__label">Log out</span>
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN ---------------- */}
      <main className="main">
        <div className="topbar topbar--page">
          <label className="search">
            <span className="ico">
              <img src="" alt="" />
              <svg className="ico__fb" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <input
              type="search"
              aria-label="Search"
              placeholder="Search activities, user, records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {/* Notification button */}
          <button type="button" className="bell" aria-label="Notifications" onClick={() => navigate("/student-notif")}>
            <img src="" alt="" />
          </button>
        </div>

        <header className="intro">
          <p className="intro__eyebrow">Records</p>
          <h1>Registrations</h1>
          <p className="intro__sub">Track status, print slips, and download certificates</p>
        </header>

        <section className="panel">
          <ul className="rows">
            {shown.map((r, i) => {
              const active = ["Registered", "Pending", "Waitlisted"].includes(r.status);
              return (
                <li className="row" key={r.id}>
                  <span className="row__index">{pad(i + 1)}</span>
                  <div className="row__text">
                    <strong>{r.title}</strong>
                    <span>
                      {fmtDate(r.date)} • {fmtTime(r.time)} • {r.venue}
                    </span>
                  </div>
                  <span className={`pill pill--${r.status.toLowerCase()}`}>{r.status.toUpperCase()}</span>
                  {active ? (
                    <>
                      <button
                        type="button"
                        className="act act--gray"
                        onClick={() => openPrintPage("slip", r, me) || showToast("Allow pop-ups to print the slip.", true)}
                      >
                        Slip
                      </button>
                      <button type="button" className="act act--gold" onClick={() => setDialog({ kind: "cancel", reg: r })}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="act act--gray"
                        disabled={!r.hasCert}
                        onClick={() => openPrintPage("cert", r, me) || showToast("Allow pop-ups to open the certificate.", true)}
                      >
                        Certificate
                      </button>
                      {r.rating ? (
                        <button type="button" className="act act--gray" disabled>
                          Rated {r.rating}/5
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="act act--gold"
                          onClick={() => {
                            setStars(5);
                            setDialog({ kind: "rate", reg: r });
                          }}
                        >
                          Rate
                        </button>
                      )}
                    </>
                  )}
                </li>
              );
            })}
            {shown.length === 0 && <li className="row row--empty">You have no registrations yet.</li>}
          </ul>
        </section>
      </main>

      {/* Cancel / Rate dialog */}
      {dialog && (
        <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="modal__box">
            {dialog.kind === "cancel" ? (
              <>
                <h3>Cancel this registration?</h3>
                <p>{dialog.reg.title}</p>
              </>
            ) : (
              <>
                <h3>Rate this activity</h3>
                <p>{dialog.reg.title}</p>
                <div className="stars" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={stars === n}
                      className={`stars__btn${stars === n ? " is-on" : ""}`}
                      onClick={() => setStars(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <small>1 = poor, 5 = excellent</small>
              </>
            )}
            <div className="modal__actions">
              <button type="button" className="act act--gray" onClick={() => setDialog(null)}>
                Back
              </button>
              <button type="button" className="act act--gold" onClick={confirmDialog} disabled={saving}>
                {dialog.kind === "cancel" ? "Yes, cancel" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast.text ? " show" : ""}${toast.error ? " toast--error" : ""}`} role="status">
        {toast.text}
      </div>
    </div>
  );
}

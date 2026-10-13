import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import "../styles/dashboard.css"; // side panel + top bar (same as the dashboard)
import "../styles/student-pages.css";

/* ------------------------------------------------------------------
   SAMPLE DATA  (shown only while Supabase is not configured yet)
   With Supabase on, the page calls supabase.rpc("get_professors"),
   "get_consultation_slots" and "book_consultation".
------------------------------------------------------------------- */
const SAMPLE_ME = { firstName: "Ruth", lastName: "Tellez", idNumber: "2024-04877" };

const SAMPLE_PROFESSORS = [
  { id: 1, title: "Prof.", fn: "", ln: "Zapanta", subject: "IS Project Management", code: "IS106" },
  { id: 2, title: "Prof.", fn: "Raquel", ln: "Cortez", subject: "Application Development", code: "" },
  { id: 3, title: "Mr.", fn: "Jhun", ln: "Alvarez", subject: "Information Management", code: "CC105" },
];
const SAMPLE_SLOTS = [
  { start: "09:00", end: "09:30" },
  { start: "09:30", end: "10:00" },
  { start: "10:00", end: "10:30" },
  { start: "10:30", end: "11:00" },
  { start: "13:00", end: "13:30" },
  { start: "13:30", end: "14:00" },
  { start: "14:00", end: "14:30" },
  { start: "14:30", end: "15:00" },
];

const PURPOSES = ["Academic", "Project", "Personal", "Other"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime2 = (t) => {
  // 07:00 -> 7:00 AM
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};
const profName = (p) => [p.title, p.fn, p.ln].filter(Boolean).join(" ");

// the next 30 days (tomorrow onward), skipping Sundays
const buildDays = () => {
  const out = [];
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (out.length < 30) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0) out.push(new Date(cur));
  }
  return out;
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/student-dashboard" },
  { key: "activities", label: "Activities", path: "/student-activity" },
  { key: "registrations", label: "Registrations", path: "/student-reg" },
  { key: "consultation", label: "Consultation", path: "/student-consultation" },
];

const PROFS_PER_PAGE = 4;
const DATES_PER_PAGE = 10;

export default function Consultation() {
  const navigate = useNavigate();
  const days = useRef(buildDays()).current;
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [me, setMe] = useState(SAMPLE_ME);
  const [profs, setProfs] = useState(isSupabaseConfigured ? [] : SAMPLE_PROFESSORS);
  const [profId, setProfId] = useState(isSupabaseConfigured ? null : SAMPLE_PROFESSORS[0].id);
  const [profPage, setProfPage] = useState(0);
  const [date, setDate] = useState(iso(days[0]));
  const [datePage, setDatePage] = useState(0);
  const [slots, setSlots] = useState(isSupabaseConfigured ? [] : SAMPLE_SLOTS);
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("Face-to-face");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ text: "", error: false });
  const toastTimer = useRef(null);

  const showToast = (text, error = false) => {
    setToast({ text, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ text: "", error: false }), 2800);
  };

  // Only logged-in students may see this page. Then load the professors.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!active) return;
      if (!s.session) return navigate("/login", { replace: true });
      const [profile, list] = await Promise.all([supabase.rpc("get_me"), supabase.rpc("get_professors")]);
      if (!active) return;
      if (profile.error || !profile.data) {
        await supabase.auth.signOut();
        return navigate("/login", { replace: true });
      }
      setMe(profile.data);
      if (list.error) showToast(list.error.message, true);
      else {
        setProfs(list.data);
        if (list.data.length) setProfId(list.data[0].id); // start with the first professor selected
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  // Free times change when the professor or date changes
  useEffect(() => {
    setTime(null);
    if (!isSupabaseConfigured || !profId || !date) return;
    let active = true;
    supabase.rpc("get_consultation_slots", { p_professor_id: profId, p_date: date }).then(({ data, error }) => {
      if (!active) return;
      if (error) showToast(error.message, true);
      else setSlots(data);
    });
    return () => {
      active = false;
    };
  }, [profId, date]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!profId) return showToast("Choose a professor.", true);
    if (!date) return showToast("Pick a date.", true);
    if (!time) return showToast("Pick a time.", true);
    setSending(true);
    if (isSupabaseConfigured) {
      const { error } = await supabase.rpc("book_consultation", {
        p_professor_id: profId,
        p_date: date,
        p_start: time,
        p_mode: mode,
        p_purpose: purpose || null,
        p_notes: notes || null,
      });
      if (error) {
        setSending(false);
        return showToast(error.message, true);
      }
    }
    showToast("Consultation requested!");
    setTimeout(() => navigate("/student-dashboard"), 1200);
  };

  if (checking) return null;

  const fullName = `${me.lastName}, ${me.firstName}`.toUpperCase();
  const q = search.trim().toLowerCase();
  const matching = profs.filter((p) => !q || [profName(p), p.subject, p.code].join(" ").toLowerCase().includes(q));
  const pageCount = Math.max(1, Math.ceil(matching.length / PROFS_PER_PAGE));
  const profShown = matching.slice(profPage * PROFS_PER_PAGE, (profPage + 1) * PROFS_PER_PAGE);
  const dateShown = days.slice(datePage * DATES_PER_PAGE, (datePage + 1) * DATES_PER_PAGE);

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
              className={`side__btn${item.key === "consultation" ? " side__btn--active" : ""}`}
              aria-current={item.key === "consultation" ? "page" : undefined}
              onClick={() => item.key !== "consultation" && navigate(item.path)}
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
              aria-label="Search professor"
              placeholder="Search Professor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setProfPage(0);
              }}
            />
          </label>
          {/* Notification button */}
          <button type="button" className="bell" aria-label="Notifications" onClick={() => navigate("/student-notif")}>
            <img src="" alt="" />
          </button>
        </div>

        <header className="intro">
          <p className="intro__eyebrow">Catalog</p>
          <h1>Book a consultation</h1>
          <p className="intro__sub">Schedule one-on-one time with your instructors</p>
        </header>

        <form className="consult" onSubmit={submit}>
          {/* 1. professor */}
          <section className="step">
            <h2 className="step__title">
              <i>1</i> Choose professor
            </h2>
            <div className="step__row">
              <div className="prof-grid">
                {profShown.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`prof${profId === p.id ? " is-selected" : ""}`}
                    onClick={() => setProfId(p.id)}
                  >
                    <span className="prof__initial">{(p.ln || "?")[0]}</span>
                    <span className="prof__text">
                      <strong>{profName(p)}</strong>
                      <small>{p.subject ? [p.subject, p.code].filter(Boolean).join(" • ") : "Faculty"}</small>
                    </span>
                  </button>
                ))}
                {profShown.length === 0 && <p className="empty">No professors found.</p>}
              </div>
              {pageCount > 1 && (
                <button
                  type="button"
                  className="arrow"
                  aria-label={profPage + 1 < pageCount ? "Next professors" : "Previous professors"}
                  onClick={() => setProfPage((profPage + 1) % pageCount)}
                >
                  {/* arrow icon */}
                  <span className="ico">
                    <img src="" alt="" />
                    <span className="ico__fb">{profPage + 1 < pageCount ? "→" : "←"}</span>
                  </span>
                </button>
              )}
            </div>
          </section>

          {/* 2. date */}
          <section className="step">
            <h2 className="step__title">
              <i>2</i> Pick a date
            </h2>
            <p className="step__year">{dateShown[0].getFullYear()}</p>
            <div className="dates">
              <button type="button" className="arrow" aria-label="Earlier dates" disabled={datePage === 0} onClick={() => setDatePage(datePage - 1)}>
                <span className="ico">
                  <img src="" alt="" />
                  <span className="ico__fb">←</span>
                </span>
              </button>
              {dateShown.map((d) => (
                <button
                  key={iso(d)}
                  type="button"
                  className={`date${date === iso(d) ? " is-selected" : ""}`}
                  onClick={() => setDate(iso(d))}
                >
                  <small>{DAYS[d.getDay()].slice(0, 3).toUpperCase()}</small>
                  <strong>{pad(d.getDate())}</strong>
                  <small>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</small>
                </button>
              ))}
              <button
                type="button"
                className="arrow"
                aria-label="Later dates"
                disabled={(datePage + 1) * DATES_PER_PAGE >= days.length}
                onClick={() => setDatePage(datePage + 1)}
              >
                <span className="ico">
                  <img src="" alt="" />
                  <span className="ico__fb">→</span>
                </span>
              </button>
            </div>
          </section>

          {/* 3. time */}
          <section className="step">
            <h2 className="step__title">
              <i>3</i> Pick a time
            </h2>
            <div className="times">
              {slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  className={`time${time === s.start ? " is-selected" : ""}`}
                  onClick={() => setTime(s.start)}
                >
                  {fmtTime2(s.start)} - {fmtTime2(s.end)}
                </button>
              ))}
              {slots.length === 0 && <span className="empty">No free times on this date.</span>}
            </div>
          </section>

          {/* 4. details */}
          <section className="step">
            <h2 className="step__title">
              <i>4</i> Details
            </h2>
            <div className="details-row">
              <div className="chips">
                {["Face-to-face", "Online"].map((m) => (
                  <button key={m} type="button" className={`chip${mode === m ? " is-selected" : ""}`} onClick={() => setMode(m)}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="select-wrap">
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)} aria-label="Purpose of Consultation">
                  <option value="">Purpose of Consultation</option>
                  {PURPOSES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                {/* dropdown arrow icon */}
                <span className="ico ico--chev">
                  <img src="" alt="" />
                  <svg className="ico__fb" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.5" />
                    <path d="M8 10.5l4 4 4-4" />
                  </svg>
                </span>
              </div>
            </div>
            <label className="notes-label" htmlFor="notes">
              What would you like to discuss?
            </label>
            <textarea id="notes" className="notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </section>

          <div className="submit-row">
            <button type="submit" className="btn-request" disabled={sending}>
              {sending ? "SENDING..." : "REQUEST CONSULTATION"}
            </button>
          </div>
        </form>
      </main>

      <div className={`toast${toast.text ? " show" : ""}${toast.error ? " toast--error" : ""}`} role="status">
        {toast.text}
      </div>
    </div>
  );
}

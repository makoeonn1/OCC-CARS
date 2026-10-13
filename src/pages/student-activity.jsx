import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import "../styles/dashboard.css"; // side panel + top bar (same as the dashboard)
import "../styles/student-pages.css";

/* ------------------------------------------------------------------
   SAMPLE DATA  (shown only while Supabase is not configured yet)
   With Supabase on, the page calls supabase.rpc("get_activities") and
   supabase.rpc("register_for_activity").
------------------------------------------------------------------- */
const SAMPLE_ME = { firstName: "Ruth", lastName: "Tellez", idNumber: "2024-04877" };

const SAMPLE_ACTIVITIES = [
  { id: 1, title: "Sports Fest 2026: Open Ceremony", description: "Kick off the annual sports festival with the parade of athletes and the lighting of the torch.", requirements: "Wear department color shirt", type: "Sports", department: null, organizer: "Student Affairs", date: "2026-11-20", time: "07:00", venue: "One Arena", capacity: 200, filled: 76, waitlist: false, myStatus: null },
  { id: 2, title: "Mental Health Awareness Talk", description: "A talk on recognizing burnout and building healthy coping habits.", requirements: null, type: "Seminar", department: null, organizer: "Guidance Office", date: "2026-12-16", time: "12:00", venue: "Auditorium", capacity: 220, filled: 220, waitlist: true, myStatus: "Pending" },
  { id: 3, title: "Digital Poster Making (SUMBINGTIK)", description: "Create a digital poster on the theme of Filipino culture using free design tools.", requirements: "Bring your own laptop", type: "Cultural", department: "BSIS", organizer: "Computer Lab", date: "2026-11-28", time: "13:00", venue: "COMPUTER LAB", capacity: 40, filled: 18, waitlist: false, myStatus: null },
  { id: 4, title: "TVET Skills Expo", description: "Showcase of hands-on skills from the technical-vocational programs.", requirements: null, type: "Others", department: "BTVTED", organizer: "BTVTED Department", date: "2027-01-15", time: "09:00", venue: "Open Grounds", capacity: 150, filled: 52, waitlist: false, myStatus: null },
  { id: 5, title: "Education Week Forum", description: "Panel discussion on the future of teaching.", requirements: null, type: "Seminar", department: "BSE", organizer: "BSE Department", date: "2027-01-20", time: "10:00", venue: "Auditorium", capacity: 120, filled: 30, waitlist: false, myStatus: null },
];

/* The texts of the two filter boxes */
const TYPES = ["Seminar", "Cultural", "Sports", "Others"];
const DEPARTMENTS = ["BSIS", "BSE", "BTVTED"];

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

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/student-dashboard" },
  { key: "activities", label: "Activities", path: "/student-activity" },
  { key: "registrations", label: "Registrations", path: "/student-reg" },
  { key: "consultation", label: "Consultation", path: "/student-consultation" },
];

/* A white box that opens a list of choices.
   The first choice ("All ...") shows everything again. */
function Filter({ allLabel, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close when clicking elsewhere or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="filter" ref={ref}>
      <button
        type="button"
        className={`filter__box${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{value || allLabel}</span>
        {/* dropdown arrow icon */}
        <span className="ico ico--chev">
          <img src="" alt="" />
          <svg className="ico__fb" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M8 10.5l4 4 4-4" />
          </svg>
        </span>
      </button>
      {open && (
        <ul className="filter__menu" role="listbox">
          {[allLabel, ...options].map((opt, i) => {
            const selected = (i === 0 && !value) || opt === value;
            return (
              <li key={opt} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`filter__opt${selected ? " is-selected" : ""}`}
                  onClick={() => {
                    onChange(i === 0 ? "" : opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Activities() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [me, setMe] = useState(SAMPLE_ME);
  const [list, setList] = useState(isSupabaseConfigured ? [] : SAMPLE_ACTIVITIES);
  const [busy, setBusy] = useState({}); // activity id -> true while the Register animation plays
  const [type, setType] = useState("");
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ text: "", error: false });
  const toastTimer = useRef(null);

  const showToast = (text, error = false) => {
    setToast({ text, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ text: "", error: false }), 2800);
  };

  // Only logged-in students may see this page. Then load the catalog.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!active) return;
      if (!s.session) return navigate("/login", { replace: true });
      const [profile, acts] = await Promise.all([supabase.rpc("get_me"), supabase.rpc("get_activities")]);
      if (!active) return;
      if (profile.error || !profile.data) {
        await supabase.auth.signOut();
        return navigate("/login", { replace: true });
      }
      setMe(profile.data);
      if (acts.error) showToast(acts.error.message, true);
      else setList(acts.data);
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

  // Register: play the click animation, save to Supabase, then show Pending
  const register = async (a) => {
    if (busy[a.id]) return;
    setBusy((b) => ({ ...b, [a.id]: true }));
    const minimum = new Promise((r) => setTimeout(r, 900)); // let the animation finish
    let status = a.filled >= a.capacity && a.waitlist ? "Waitlisted" : "Pending";
    let failed = "";
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc("register_for_activity", { p_activity_id: a.id });
      if (error) failed = error.message;
      else status = data.status;
    }
    await minimum;
    setBusy((b) => {
      const next = { ...b };
      delete next[a.id];
      return next;
    });
    if (failed) return showToast(failed, true);
    setList((l) => l.map((x) => (x.id === a.id ? { ...x, myStatus: status, filled: x.filled + 1 } : x)));
    showToast(status === "Pending" ? "Registration sent. Waiting for approval." : "You were added to the waitlist.");
  };

  if (checking) return null;

  const fullName = `${me.lastName}, ${me.firstName}`.toUpperCase();
  const q = search.trim().toLowerCase();
  const shown = list.filter(
    (a) =>
      (!type || a.type === type) &&
      (!department || !a.department || a.department === department) && // no department = open to everyone
      (!q || [a.title, a.description, a.venue, a.type, a.department, a.organizer].join(" ").toLowerCase().includes(q))
  );

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
              className={`side__btn${item.key === "activities" ? " side__btn--active" : ""}`}
              aria-current={item.key === "activities" ? "page" : undefined}
              onClick={() => item.key !== "activities" && navigate(item.path)}
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

        <div className="catalog-head">
          <header className="intro">
            <p className="intro__eyebrow">Catalog</p>
            <h1>Browse Activities</h1>
            <p className="intro__sub">{shown.length} open for registration</p>
          </header>
          <div className="filters">
            <Filter allLabel="All types" options={TYPES} value={type} onChange={setType} />
            <Filter allLabel="All departments" options={DEPARTMENTS} value={department} onChange={setDepartment} />
          </div>
        </div>

        <ul className="cards">
          {shown.map((a) => {
            const full = a.filled >= a.capacity;
            const mine = a.myStatus && a.myStatus !== "Cancelled" ? a.myStatus : null;
            return (
              <li className="card" key={a.id}>
                <div className="card__main">
                  <h2 className="card__title">
                    {a.title}
                    <span className="card__meta">
                      {fmtDate(a.date)} • {fmtTime(a.time)} • {a.venue} • {a.type}
                      {a.organizer ? ` • ${a.organizer}` : ""}
                    </span>
                  </h2>
                  {a.description && <p className="card__desc">{a.description}</p>}
                  {a.requirements && (
                    <p className="card__desc">
                      <strong>Requirements:</strong> {a.requirements}
                    </p>
                  )}
                  <p className="card__slots">
                    {a.filled}/{a.capacity} slots filled{full && a.waitlist ? " · waitlist available" : ""}
                  </p>
                </div>

                <div className="card__side">
                  <span className="pill-open">OPEN</span>
                  {mine === "Pending" || mine === "Waitlisted" ? (
                    <button type="button" className="reg reg--pending" disabled>
                      {mine}
                    </button>
                  ) : mine ? (
                    <button type="button" className="reg reg--done" disabled>
                      {mine}
                    </button>
                  ) : full && !a.waitlist ? (
                    <button type="button" className="reg reg--done" disabled>
                      Full
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`reg${busy[a.id] ? " is-registering" : ""}`}
                      onClick={() => register(a)}
                      disabled={!!busy[a.id]}
                    >
                      {busy[a.id] ? (
                        <span className="reg__dots" aria-label="Registering">
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : full ? (
                        "Join waitlist"
                      ) : (
                        "Register"
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {shown.length === 0 && <p className="empty">No activities match your filters.</p>}
      </main>

      <div className={`toast${toast.text ? " show" : ""}${toast.error ? " toast--error" : ""}`} role="status">
        {toast.text}
      </div>
    </div>
  );
}

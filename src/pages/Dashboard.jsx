import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import "../styles/dashboard.css";

/* ------------------------------------------------------------------
   SAMPLE DATA
   Replace these with data loaded from Supabase tables (profiles,
   subjects, activities, consultations, certificates) when they exist.
------------------------------------------------------------------- */
const STUDENT = {
  name: "TELLEZ, RUTH",
  idNumber: "2024-04877",
  program: "Bachelor of Science in Information System",
  semester: "First Semester, A.Y. 2026 - 2027",
  certificatesEarned: 6, // total earned; the list below shows the recent ones
};

const SUBJECTS = [
  { code: "CC106", title: "APPLICATION DEVELOPMENT & EMERGING TECHNOLOGIES", schedule: "Wed • 7:00 AM - 12:00 NN" },
  { code: "CC105", title: "INFORMATION MANAGEMENT", schedule: "Friday • 7:00 AM - 12:00 NN" },
  { code: "IS106", title: "IS PROJECT MANAGEMENT 1", schedule: "Sat • 10:00 AM - 1:00 PM" },
  { code: "ADV04", title: "BUSINESS INTELLIGENCE", schedule: "Sat • 2:00 PM - 5:00 PM" },
];

const ACTIVITIES = [
  { title: "Digital Poster Making (SUMBINGTIK)", details: "November 28, 2026 • 1:00PM • COMPUTER LAB", status: "REGISTERED" },
  { title: "Mental Health Awareness Talk", details: "December 16, 2026 • 12:00NN • Auditorium", status: "PENDING" },
];

const CONSULTATIONS = [
  { title: "Mr. Jhun Alvarez", details: "Friday • 1:00PM - 1:30 PM • COMLAB2", status: "PENDING" },
];

const CERTIFICATES = [
  { title: "Sports Fest 2026: Open Ceremony", details: "November 20, 2026 • 7:00AM • One Arena" },
  { title: "Sports Fest 2026: Open Ceremony", details: "November 20, 2026 • 7:00AM • One Arena" },
  { title: "Sports Fest 2026: Open Ceremony", details: "November 20, 2026 • 7:00AM • One Arena" },
  { title: "Sports Fest 2026: Open Ceremony", details: "November 20, 2026 • 7:00AM • One Arena" },
];

/* Small inline icons (they follow the text color, so they change on hover) */
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  activities: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  registrations: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),
  consultation: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M17 6h4M17 10h4" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4-4" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "activities", label: "Activities" },
  { key: "registrations", label: "Registrations" },
  { key: "consultation", label: "Consultation" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(isSupabaseConfigured);

  // Only logged-in students may see this page.
  useEffect(() => {
    if (!isSupabaseConfigured) return; // preview mode: Supabase keys not set yet
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) navigate("/login", { replace: true });
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (checking) return null;

  const registeredCount = ACTIVITIES.filter((a) => a.status === "REGISTERED").length;

  const stats = [
    { value: SUBJECTS.length, label: "Enrolled Subjects" },
    { value: registeredCount, label: "Registered Activities" },
    { value: CONSULTATIONS.length, label: "Booked Consultations" },
    { value: STUDENT.certificatesEarned, label: "Certificates Earned" },
  ];

  return (
    <div className="dash">
      {/* ---------------- SIDE PANEL (fixed) ---------------- */}
      <aside className="side">
        <div className="side__top">
          {/* School icon */}
          <img className="side__school" src="" alt="OCC logo" />
          <span className="side__name">{STUDENT.name}</span>
        </div>

        <nav className="side__nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`side__btn${item.key === "dashboard" ? " side__btn--active" : ""}`}
              aria-current={item.key === "dashboard" ? "page" : undefined}
            >
              {icons[item.key]}
              <span className="side__label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="side__bottom">
          <div className="side__profile">
            {/* Profile icon */}
            <img className="side__avatar" src="" alt="Profile" />
            <div className="side__profile-text">
              <strong>{STUDENT.name}</strong>
              <span>{STUDENT.idNumber}</span>
            </div>
          </div>
          <button type="button" className="side__logout" onClick={handleLogout}>
            {icons.logout}
            <span className="side__label">Log out</span>
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN ---------------- */}
      <main className="main">
        <div className="topbar">
          <label className="search">
            {icons.search}
            <input type="search" aria-label="Search" />
          </label>
          {/* Notification button (black) */}
          <button type="button" className="bell" aria-label="Notifications">
            <img src="" alt="" />
          </button>
        </div>

        <header className="intro">
          <p className="intro__eyebrow">Overview</p>
          <h1>Good Day, Student!</h1>
          <p className="intro__sub">
            {STUDENT.program} • {STUDENT.idNumber}
          </p>
        </header>

        <section className="stats" aria-label="Summary">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        {/* Enrolled Subjects */}
        <section className="panel">
          <div className="panel__head">
            <h2>Enrolled Subjects</h2>
            <span className="panel__meta">{STUDENT.semester}</span>
          </div>
          <ul className="rows">
            {SUBJECTS.map((s) => (
              <li className="row row--subject" key={s.code}>
                <span className="row__index">{s.code}</span>
                <div className="row__text">
                  <strong>{s.title}</strong>
                  <span>{s.schedule}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Registered Activities */}
        <section className="panel">
          <div className="panel__head">
            <h2>Registered Activities</h2>
            <button type="button" className="panel__link">
              Manage Activities <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          <ul className="rows">
            {ACTIVITIES.map((a, i) => (
              <li className="row" key={a.title}>
                <span className="row__index">{String(i + 1).padStart(2, "0")}</span>
                <div className="row__text">
                  <strong>{a.title}</strong>
                  <span>{a.details}</span>
                </div>
                <span className={`badge badge--${a.status.toLowerCase()}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Booked Consultations */}
        <section className="panel">
          <div className="panel__head">
            <h2>Booked Consultations</h2>
            <button type="button" className="panel__link">
              Manage Consultation <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          <ul className="rows">
            {CONSULTATIONS.map((c, i) => (
              <li className="row" key={c.title}>
                <span className="row__index">{String(i + 1).padStart(2, "0")}</span>
                <div className="row__text">
                  <strong>{c.title}</strong>
                  <span>{c.details}</span>
                </div>
                <span className={`badge badge--${c.status.toLowerCase()}`}>{c.status}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Certificates */}
        <section className="panel">
          <div className="panel__head">
            <h2>Certificates</h2>
          </div>
          <ul className="rows">
            {CERTIFICATES.map((c, i) => (
              <li className="row" key={i}>
                <span className="row__index">{String(i + 1).padStart(2, "0")}</span>
                <div className="row__text">
                  <strong>{c.title}</strong>
                  <span>{c.details}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

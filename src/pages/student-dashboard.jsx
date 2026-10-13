import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import "../styles/dashboard.css";

/* ------------------------------------------------------------------
   SAMPLE DATA  (shown only while Supabase is not configured yet)
   When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, the page
   loads the logged-in student's real data with supabase.rpc("get_me")
   and supabase.rpc("get_dashboard") instead.
------------------------------------------------------------------- */
const SAMPLE_ME = {
  firstName: "Ruth",
  lastName: "Tellez",
  idNumber: "2024-04877",
  program: "Bachelor of Science in Information System",
};

const SAMPLE_DASHBOARD = {
  stats: { EnrolledSubjects: 4, RegisteredActivities: 1, BookedConsultations: 1, CertificatesEarned: 6 },
  subjects: [
    { code: "CC106", title: "Application Development & Emerging Technologies", day: "Wed", ts: "07:00", te: "12:00", semester: "First Semester", academicYear: "2026 - 2027" },
    { code: "CC105", title: "Information Management", day: "Friday", ts: "07:00", te: "12:00", semester: "First Semester", academicYear: "2026 - 2027" },
    { code: "IS106", title: "IS Project Management 1", day: "Sat", ts: "10:00", te: "13:00", semester: "First Semester", academicYear: "2026 - 2027" },
    { code: "ADV04", title: "Business Intelligence", day: "Sat", ts: "14:00", te: "17:00", semester: "First Semester", academicYear: "2026 - 2027" },
  ],
  activities: [
    { id: 1, title: "Digital Poster Making (SUMBINGTIK)", status: "Registered", date: "2026-11-28", time: "13:00", venue: "COMPUTER LAB" },
    { id: 2, title: "Mental Health Awareness Talk", status: "Pending", date: "2026-12-16", time: "12:00", venue: "Auditorium" },
  ],
  consultations: [
    { id: 1, ptitle: "Mr.", fn: "Jhun", ln: "Alvarez", status: "Pending", date: "2026-10-30", ts: "13:00", te: "13:30", room: "COMLAB2" },
  ],
  certificates: [
    { id: 1, title: "Sports Fest 2026: Open Ceremony", date: "2026-11-20", time: "07:00", venue: "One Arena" },
  ],
};

/* ---------- small helpers: turn database values into text ---------- */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad = (n) => String(n).padStart(2, "0");
const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtDate = (s) => {
  const d = parseDate(s);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
const fmtTime = (t) => {
  // 07:00 -> 7:00AM, 12:00 -> 12:00NN
  const [h, m] = t.split(":").map(Number);
  if (h === 12 && m === 0) return "12:00NN";
  return `${h % 12 || 12}:${pad(m)}${h >= 12 ? "PM" : "AM"}`;
};
const fmtTime2 = (t) => {
  // 07:00 -> 7:00 AM
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};
const profName = (p) => [p.ptitle, p.fn, p.ln].filter(Boolean).join(" ");

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/student-dashboard" },
  { key: "activities", label: "Activities", path: "/student-activity" },
  { key: "registrations", label: "Registrations", path: "/student-reg" },
  { key: "consultation", label: "Consultation", path: "/student-consultation" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [me, setMe] = useState(SAMPLE_ME);
  const [data, setData] = useState(SAMPLE_DASHBOARD);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Only logged-in students may see this page. Then load their data.
  useEffect(() => {
    if (!isSupabaseConfigured) return; // preview mode: Supabase keys not set yet
    let active = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!active) return;
      if (!s.session) return navigate("/login", { replace: true });

     
      const [profile, dash] = await Promise.all([
        supabase.rpc("get_me"),
        supabase.rpc("get_dashboard"),
      ]);

      if (!active) return;

      if (profile.error) {
        console.error("get_me error:", profile.error);
        setError(`Could not load your student profile: ${profile.error.message}`);
        setChecking(false);
        return;
      }

      if (!profile.data) {
        console.error("get_me returned no profile:", profile.data);
        setError(
          "Your login succeeded, but no student profile was returned. Check your student record in Supabase."
        );
        setChecking(false);
        return;
      }

      setMe(profile.data);

      if (dash.error) {
        console.error("get_dashboard error:", dash.error);
        setError(`Could not load dashboard data: ${dash.error.message}`);
      } else if (dash.data) {
        setData(dash.data);
      }

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

  if (checking) return null;

  const fullName = `${me.lastName}, ${me.firstName}`.toUpperCase();
  const st = data.stats || {};
  const stats = [
    { value: st.EnrolledSubjects ?? 0, label: "Enrolled Subjects" },
    { value: st.RegisteredActivities ?? 0, label: "Registered Activities" },
    { value: st.BookedConsultations ?? 0, label: "Booked Consultations" },
    { value: st.CertificatesEarned ?? 0, label: "Certificates Earned" },
  ];
  const sem = data.subjects[0];
  const semester = sem ? `${sem.semester}, A.Y. ${sem.academicYear}` : "";

  // the search box filters the rows on this page
  const term = search.trim().toLowerCase();
  const match = (...parts) => !term || parts.join(" ").toLowerCase().includes(term);

  const subjects = data.subjects.filter((s) => match(s.code, s.title, s.day));
  const activities = data.activities.filter((a) => match(a.title, a.status, a.venue));
  const consultations = data.consultations.filter((c) => match(profName(c), c.status, c.room));
  const certificates = data.certificates.filter((c) => match(c.title, c.venue));

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
              className={`side__btn${item.key === "dashboard" ? " side__btn--active" : ""}`}
              aria-current={item.key === "dashboard" ? "page" : undefined}
              onClick={() => item.key !== "dashboard" && navigate(item.path)}
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
        {/* First screen: top bar, overview, summary cards and Enrolled Subjects.
            It always fills the screen height, so the first thing seen ends at
            the last enrolled subject. Everything else is below, by scrolling. */}
        <div className="overview">
        <div className="topbar">
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
          <p className="intro__eyebrow">Overview</p>
          <h1>Good Day, {me.firstName || "Student"}!</h1>
          <p className="intro__sub">
            {me.program} • {me.idNumber}
          </p>
        </header>

        {error && <p className="page-error" role="alert">{error}</p>}

        <section className="stats" aria-label="Summary">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        {/* Enrolled Subjects (stretches to fill the rest of the first screen) */}
        <section className="panel panel--fill">
          <div className="panel__head">
            <h2>Enrolled Subjects</h2>
            <span className="panel__meta">{semester}</span>
          </div>
          <ul className="rows">
            {subjects.map((s) => (
              <li className="row row--subject" key={s.code}>
                <span className="row__index">{s.code}</span>
                <div className="row__text">
                  <strong>{s.title.toUpperCase()}</strong>
                  <span>
                    {s.day} • {fmtTime2(s.ts)} - {fmtTime2(s.te)}
                  </span>
                </div>
              </li>
            ))}
            {subjects.length === 0 && <li className="row row--empty">You are not enrolled in any subject yet.</li>}
          </ul>
        </section>
        </div>

        {/* Registered Activities */}
        <section className="panel">
          <div className="panel__head">
            <h2>Registered Activities</h2>
            <button type="button" className="panel__link" onClick={() => navigate("/student-activity")}>
              Manage Activities <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          <ul className="rows">
            {activities.map((a, i) => (
              <li className="row" key={a.id}>
                <span className="row__index">{pad(i + 1)}</span>
                <div className="row__text">
                  <strong>{a.title}</strong>
                  <span>
                    {fmtDate(a.date)} • {fmtTime(a.time)} • {a.venue}
                  </span>
                </div>
                <span className={`badge badge--${a.status.toLowerCase()}`}>{a.status.toUpperCase()}</span>
              </li>
            ))}
            {activities.length === 0 && (
              <li className="row row--empty">No registered activities yet. Browse activities to join one.</li>
            )}
          </ul>
        </section>

        {/* Booked Consultations */}
        <section className="panel">
          <div className="panel__head">
            <h2>Booked Consultations</h2>
            <button type="button" className="panel__link" onClick={() => navigate("/student-consultation")}>
              Manage Consultation <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          <ul className="rows">
            {consultations.map((c, i) => (
              <li className="row" key={c.id}>
                <span className="row__index">{pad(i + 1)}</span>
                <div className="row__text">
                  <strong>{profName(c)}</strong>
                  <span>
                    {DAYS[parseDate(c.date).getDay()]} • {fmtTime(c.ts)} - {fmtTime(c.te)}
                    {c.room ? ` • ${c.room}` : ""}
                  </span>
                </div>
                <span className={`badge badge--${c.status.toLowerCase()}`}>{c.status.toUpperCase()}</span>
              </li>
            ))}
            {consultations.length === 0 && <li className="row row--empty">No booked consultations.</li>}
          </ul>
        </section>

        {/* Certificates */}
        <section className="panel">
          <div className="panel__head">
            <h2>Certificates</h2>
          </div>
          <ul className="rows">
            {certificates.map((c, i) => (
              <li className="row" key={c.id}>
                <span className="row__index">{pad(i + 1)}</span>
                <div className="row__text">
                  <strong>{c.title}</strong>
                  <span>
                    {fmtDate(c.date)} • {fmtTime(c.time)} • {c.venue}
                  </span>
                </div>
              </li>
            ))}
            {certificates.length === 0 && <li className="row row--empty">No certificates yet.</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}

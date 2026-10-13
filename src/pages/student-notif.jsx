import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import "../styles/dashboard.css"; // side panel + top bar (same as the dashboard)
import "../styles/student-pages.css";

/* ------------------------------------------------------------------
   SAMPLE DATA  (shown only while Supabase is not configured yet)
   With Supabase on, the page calls supabase.rpc("get_notifications")
   and supabase.rpc("delete_notification").
------------------------------------------------------------------- */
const SAMPLE_ME = { firstName: "Ruth", lastName: "Tellez", idNumber: "2024-04877" };

const SAMPLE_NOTIFICATIONS = [
  { id: 1, message: "Your registration for Digital Poster Making (SUMBINGTIK) is confirmed.", date: "2026-10-12" },
  { id: 2, message: "Certificate available: Sports Fest 2026: Open Ceremony", date: "2026-10-12" },
  { id: 3, message: "Your registration for Mental Health Awareness Talk is still pending approval.", date: "2026-10-11" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/student-dashboard" },
  { key: "activities", label: "Activities", path: "/student-activity" },
  { key: "registrations", label: "Registrations", path: "/student-reg" },
  { key: "consultation", label: "Consultation", path: "/student-consultation" },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [me, setMe] = useState(SAMPLE_ME);
  const [list, setList] = useState(isSupabaseConfigured ? [] : SAMPLE_NOTIFICATIONS);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ text: "", error: false });
  const toastTimer = useRef(null);

  const showToast = (text, error = false) => {
    setToast({ text, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ text: "", error: false }), 2800);
  };

  // Only logged-in students may see this page. Then load their notifications.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!active) return;
      if (!s.session) return navigate("/login", { replace: true });
      const [profile, notes] = await Promise.all([supabase.rpc("get_me"), supabase.rpc("get_notifications")]);
      if (!active) return;
      if (profile.error || !profile.data) {
        await supabase.auth.signOut();
        return navigate("/login", { replace: true });
      }
      setMe(profile.data);
      if (notes.error) showToast(notes.error.message, true);
      else setList(notes.data);
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

  const remove = async (id) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.rpc("delete_notification", { p_id: id });
      if (error) return showToast(error.message, true);
    }
    setList((l) => l.filter((n) => n.id !== id));
  };

  if (checking) return null;

  const fullName = `${me.lastName}, ${me.firstName}`.toUpperCase();
  const q = search.trim().toLowerCase();
  const shown = list.filter((n) => !q || n.message.toLowerCase().includes(q));

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
            <button key={item.key} type="button" className="side__btn" onClick={() => navigate(item.path)}>
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
          <button type="button" className="bell" aria-label="Notifications">
            <img src="" alt="" />
          </button>
        </div>

        <header className="intro">
          <p className="intro__eyebrow">Records</p>
          <h1>Notifications</h1>
          <p className="intro__sub">Approvals, reminders, and schedule changes</p>
        </header>

        <section className="panel">
          <ul className="rows">
            {shown.map((n, i) => (
              <li className="row" key={n.id}>
                <span className="row__index">{pad(i + 1)}</span>
                <div className="row__text">
                  <strong>{n.message}</strong>
                  <span>{fmtDate(n.date)}</span>
                </div>
                <button type="button" className="icon-btn" aria-label="Delete notification" onClick={() => remove(n.id)}>
                  {/* delete (trash) icon */}
                  <span className="ico">
                    <img src="" alt="" />
                    <svg className="ico__fb" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
                    </svg>
                  </span>
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="row row--empty">You have no notifications.</li>}
          </ul>
        </section>
      </main>

      <div className={`toast${toast.text ? " show" : ""}${toast.error ? " toast--error" : ""}`} role="status">
        {toast.text}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import "../styles/home.css";

const GOALS = [
  "Pursue academic excellence",
  "Ensure transformational learning environment",
  "Advance effective processes and systems",
  "Promote research, creativity, and scholarship",
  "Undertake outreach and public engagement",
  "Engage in collaborative partnerships",
  "Sustain fiscal responsibility",
  "Promote nationalism and love of country",
];

const VALUES_LEFT = [
  ["O", "Openness"],
  ["N", "Nurture relationships"],
  ["E", "Ethical and professional behavior"],
];

const VALUES_RIGHT = [
  ["C", "Creativity and independent thinking"],
  ["A", "Active engagement"],
  ["I", "Integrity"],
  ["N", "Nationalism"],
  ["T", "Teamwork"],
  ["A", "Accountability and honesty"],
];

export default function Home() {
  const scrollToAbout = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="home">
      {/* ---------- HERO ---------- */}
      <section className="hero">
        {/* Background school image */}
        <img className="hero__bg" src="/images/occ-backgroundimg.png" alt="One Cainta College building" />
        <div className="hero__overlay" />

        <header className="hero__nav">
          {/* Circle logo at the left side of the "One Cainta College" text */}
          <img className="hero__logo" src="/images/occ-logo.jpg" alt="OCC logo" />
          <span className="hero__brand">ONE CAINTA COLLEGE</span>
        </header>

        <div className="hero__content">
          <h1 className="hero__title">
            Every campus
            <br />
            activity all in one
            <br />
            place
          </h1>
          <p className="hero__subtitle">
            Browse, register, and book faculty consultations — built for
            students, faculty, and admin.
          </p>

          <div className="hero__actions">
            <button type="button" className="hero__btn" onClick={scrollToAbout}>
              {/* Explore more icon */}
              <img className="hero__btn-icon" src="" alt="" />
              <span>Explore More</span>
            </button>

            <Link to="/login" className="hero__btn">
              {/* Log in icon */}
              <img className="hero__btn-icon" src="" alt="" />
              <span>Log in</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- ABOUT ---------- */}
      <section id="about" className="about">
        <div className="about__inner">
          <div className="about__crest">
            {/* Circle at the middle, above the "One Cainta College" text */}
            <img src="" alt="OCC seal" />
          </div>

          <div className="about__heading">
            <span className="about__line" />
            <h2>ONE CAINTA COLLEGE</h2>
            <span className="about__line" />
          </div>

          <p className="about__admin">
            <strong>DR. VICTORIA NAVAL</strong>
            <br />
            OIC-College Administrator
          </p>

          <div className="block">
            <h3>VISION</h3>
            <p>
              One Cainta College (OCC) is a recognized reputable educational
              institution of higher learning committed to nurture and elevate
              the quality of the lives of its people through accessible quality
              education that promotes excellence in instruction, research,
              community development, and partnerships.
            </p>
          </div>

          <div className="block">
            <h3>MISSION</h3>
            <p>
              The mission of the OCC is to provide high-quality educational
              programs, services, and support to the students of Cainta to
              prepare them for career success in the global economy.
            </p>
            <p>
              It shall offer quality and relevant non-degree and undergraduate
              degree programs that are based on community and students&apos;
              needs to lead them to better lives.
            </p>
            <p>
              It shall engage in transformational development as a college to
              address societal needs towards positive development of the
              social, economic, and cultural life of the people of Cainta and
              the global society.
            </p>
          </div>

          <div className="block block--split">
            <div className="goals">
              <h3>EIGHT (8) POINT INSTITUTIONAL GOALS</h3>
              <p>
                The college has established eight (8) strategic goals that will
                help the college fulfill its Mission and achieve its Vision.
                Each unit of the college will develop plans that include
                measurable objectives and strategies for achieving the
                following goals:
              </p>
              <ul className="goals__list">
                {GOALS.map((goal, i) => (
                  <li key={goal}>
                    <span className="goals__num">Goal {i + 1}:</span> {goal}
                  </li>
                ))}
              </ul>
            </div>

            <div className="values">
              <h3>CORE VALUES</h3>
              <p>The college is guided by a set of core values:</p>
              <div className="values__cols">
                <ValueList items={VALUES_LEFT} />
                <ValueList items={VALUES_RIGHT} />
              </div>
            </div>
          </div>

          <span className="about__end-line" />
        </div>
      </section>
    </div>
  );
}

function ValueList({ items }) {
  return (
    <ul className="values__list">
      {items.map(([letter, text], i) => (
        <li key={`${letter}-${i}`}>
          <span className="values__letter">{letter}</span>
          {text}
        </li>
      ))}
    </ul>
  );
}

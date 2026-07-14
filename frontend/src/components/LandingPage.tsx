import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
}

function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="mtm-landing mtm-fade-in">
      <div className="mtm-landing-card">
        <h1>Willkommen im Venner Moor</h1>
        <p className="lede">
          Ein digitaler Zwilling eines Moores: ein lebendiges Ökosystem, das du
          direkt befragen kannst — über seinen aktuellen Zustand, seine
          Sensordaten und Moore im Allgemeinen.
        </p>

        <ol className="mtm-steps">
          <li>
            <span className="step-num">1</span>
            <div className="step-text">
              <strong>Sensoren im Moor</strong>
              <p>Temperatur, pH-Wert und CO₂ werden laufend an drei Standorten (Nord, Zentrum, Süd) erfasst.</p>
            </div>
          </li>
          <li>
            <span className="step-num">2</span>
            <div className="step-text">
              <strong>Ein LLM mit Zugriff auf diese Daten</strong>
              <p>Deine Fragen werden von einem Sprachmodell beantwortet, das per Function-Calling aktuelle und historische Werte abrufen kann.</p>
            </div>
          </li>
          <li>
            <span className="step-num">3</span>
            <div className="step-text">
              <strong>Ein Gespräch mit dem Moor selbst</strong>
              <p>Frag nach dem aktuellen Zustand, Trends über Zeit, oder ganz allgemein zu Mooren, Ökosystemen und Klima.</p>
            </div>
          </li>
        </ol>

        <button className="mtm-start-btn" onClick={onStart}>
          Chat starten
        </button>
      </div>
    </div>
  );
}

export default LandingPage;

export default function Navbar({ pageProgress, isAltMode, onToggleMode }) {
  return (
    <header className="nav-wrap">
      <div className="page-progress" aria-hidden="true">
        <span style={{ width: `${pageProgress}%` }} />
      </div>
      <nav className="nav">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            Rs
          </span>
          FutureForge
        </a>
        <button className="nav-btn" onClick={onToggleMode} aria-label="Toggle mood">
          {isAltMode ? 'Cool Mode' : 'Warm Mode'}
        </button>
      </nav>
    </header>
  );
}

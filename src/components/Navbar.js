import { useEffect, useRef, useState } from "react";

export default function Navbar({
  pageProgress,
  isAltMode,
  onToggleMode,
  onOpenAuth,
  onGoHome,
  user,
  isProfileActive,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setIsMenuOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleBrandClick = (e) => {
    e.preventDefault();
    onGoHome();
    setIsMenuOpen(false);
  };

  return (
    <header className="nav-wrap">
      {!isProfileActive && (
        <div className="page-progress" aria-hidden="true">
          <span style={{ width: `${pageProgress}%` }} />
        </div>
      )}

      <nav className="nav">
        <div className="nav-left">
          <a className="brand" href="/" onClick={handleBrandClick}>
            <span className="brand-mark">FF</span>
            <span className="brand-text">FutureForge</span>
          </a>
        </div>

        {!isProfileActive && (
          <div className="nav-center">
            <span className="nav-pill">
              <span className="nav-pulse" />
              Decision Engine Live
            </span>
          </div>
        )}

        <div className="nav-actions" ref={menuRef}>
          <button
            className={`nav-menu-btn ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="line line-a" />
            <span className="line line-b" />
            <span className="line line-c" />
          </button>

          {isMenuOpen && (
            <div className="nav-menu-dropdown">
              {/* Show Home only when on Profile */}
              {isProfileActive ? (
                <button className="menu-item" onClick={handleBrandClick}>
                  <span className="menu-item-glyph">H</span>
                  <div className="menu-item-content">
                    <span className="menu-item-title">Home</span>
                    <span className="menu-item-sub">Exit Dashboard</span>
                  </div>
                </button>
              ) : (
                /* Show Dashboard only when on Home */
                user && (
                  <button className="menu-item" onClick={onOpenAuth}>
                    <span className="menu-item-glyph">D</span>
                    <div className="menu-item-content">
                      <span className="menu-item-title">Dashboard</span>
                      <span className="menu-item-sub">Manage Core Data</span>
                    </div>
                  </button>
                )
              )}

              <button className="menu-item" onClick={onToggleMode}>
                <span className="menu-item-glyph">T</span>
                <div className="menu-item-content">
                  <span className="menu-item-title">Appearance</span>
                  <span className="menu-item-sub">
                    {isAltMode ? "Warm Mode" : "Cool Mode"}
                  </span>
                </div>
              </button>

              {!user && (
                <button className="menu-item" onClick={onOpenAuth}>
                  <span className="menu-item-glyph">A</span>
                  <div className="menu-item-content">
                    <span className="menu-item-title">Authorize</span>
                    <span className="menu-item-sub">Login or Sign up</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

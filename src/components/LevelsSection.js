export default function LevelsSection() {
  return (
    <section id="levels" className="section reveal">
      <span className="eyebrow">Progression</span>
      <h2 className="section-title">Learning Levels</h2>

      <div className="levels-grid">
        <div className="level-card">
          <span className="level-badge lvl-1">Beginner</span>
          <h3 className="level-title">Explorer</h3>
          <p className="level-copy">
            Focus on savings rate and basic budgeting. Volatility is low. Ideal for understanding
            the habit gap.
          </p>
        </div>
        <div className="level-card">
          <span className="level-badge lvl-2">Intermediate</span>
          <h3 className="level-title">Analyst</h3>
          <p className="level-copy">
            Inflation varies. Markets dip. You must manage an emergency fund while investing for
            growth.
          </p>
        </div>
        <div className="level-card">
          <span className="level-badge lvl-3">Advanced</span>
          <h3 className="level-title">Strategist</h3>
          <p className="level-copy">
            The 2008 mode. Massive crashes, job loss risk, and pure psychological training for
            holding the course.
          </p>
        </div>
      </div>
    </section>
  );
}

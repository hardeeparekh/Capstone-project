export default function MathSection() {
  return (
    <section className="section">
      <div className="math-section reveal">
        <div className="math-bg-grid" />
        <h2 className="math-title">Under the Hood</h2>
        <div className="code-block">P(t+1) = (P(t) + Invest - W/D) x (1 + r(t))</div>
        <p className="math-copy">
          Simulation math is rule-based. The AI acts as a coach, explaining the why behind the
          math, but the numbers do not lie.
        </p>
      </div>
    </section>
  );
}

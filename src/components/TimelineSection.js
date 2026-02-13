export default function TimelineSection({ timelineRef, timelineProgress }) {
  return (
    <section id="features" className="section feature-timeline-section section-cut">
      <div className="timeline-head reveal">
        <span className="eyebrow">Core Logic</span>
        <h2 className="section-title">Decision Timeline</h2>
      </div>

      <div className="feature-timeline" id="featureTimeline" ref={timelineRef}>
        <div className="timeline-line" aria-hidden="true">
          <span className="timeline-progress" style={{ height: `${timelineProgress}%` }} />
        </div>

        <article className="feature-node left reveal reveal-left tilt" data-step="01">
          <span className="step-number">01</span>
          <span className="tag">Feature 1</span>
          <h3 className="feature-title">Financial Foundation</h3>
          <p className="feature-copy">
            Users enter age, salary, and savings. The system builds a Monte Carlo projection of
            your current trajectory before the game begins.
          </p>
        </article>

        <article className="feature-node right reveal reveal-right tilt" data-step="02">
          <span className="step-number">02</span>
          <span className="tag">Feature 2</span>
          <h3 className="feature-title">The Life Path Engine</h3>
          <p className="feature-copy">
            Year-by-year decisions. Every click ages your portfolio. You choose: upgrade
            lifestyle, invest the bonus, or panic sell.
          </p>
        </article>

        <article className="feature-node left reveal reveal-left tilt" data-step="03">
          <span className="step-number">03</span>
          <span className="tag">Feature 3</span>
          <h3 className="feature-title">Outcome Reflection</h3>
          <p className="feature-copy">
            At age 60 (simulated), compare your played life vs safe baseline. See the cost of
            hesitation or reward of disciplined risk.
          </p>
        </article>
      </div>
    </section>
  );
}

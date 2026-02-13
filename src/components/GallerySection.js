export default function GallerySection() {
  return (
    <section className="section gallery-section reveal" id="preview">
      <span className="eyebrow">The Experience</span>
      <h2 className="section-title">See the simulation in action</h2>

      <div className="gallery-grid">
        <div className="gallery-card">
          <div className="card-visual">
            <div className="art-graph">
              <div className="art-bar bar-1" />
              <div className="art-bar bar-2" />
              <div className="art-bar bar-3" />
              <div className="art-bar bar-4" />
              <div className="art-bar bar-5" />
            </div>
          </div>
          <div className="card-content">
            <div className="card-title">Stochastic Projections</div>
            <div className="card-desc">
              See 1,000 potential futures. We model best-case, worst-case, and black swan
              events so you understand probability ranges.
            </div>
          </div>
        </div>

        <div className="gallery-card">
          <div className="card-visual">
            <div className="art-alert">
              <div className="art-alert-title">! Inflation Spike</div>
              <div className="art-line" />
              <div className="art-line short" />
            </div>
          </div>
          <div className="card-content">
            <div className="card-title">Shock Events</div>
            <div className="card-desc">
              Life is not a straight line. Handle sudden medical bills, job loss, or market
              crashes in a safe environment.
            </div>
          </div>
        </div>

        <div className="gallery-card">
          <div className="card-visual">
            <div className="art-pie" />
          </div>
          <div className="card-content">
            <div className="card-title">Asset Allocation</div>
            <div className="card-desc">
              Learn how to balance high-risk growth assets with stable safety nets based on your
              age and goals.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

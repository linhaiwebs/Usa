import { useState } from 'react'
import './index.css'

function openPopup() {
  if (typeof window !== 'undefined' && typeof window.showSitePopup === 'function') {
    window.showSitePopup()
  }
}

function App() {
  const [activeDot, setActiveDot] = useState(0)

  const stocks = [
    { symbol: 'SPY', price: '$710.14', change: '+8.48 (+1.21%)' },
    { symbol: 'QQQ', price: '$648.85', change: '+8.49 (+1.31%)' },
    { symbol: 'AAPL', price: '$270.23', change: '+6.82 (+2.59%)' },
  ]

  const features = [
    { label: 'Analysis Speed', usTitle: 'Real-time reports', themTitle: 'Hours of research' },
    { label: 'Risk Detection', usTitle: 'Deep AI mining', themTitle: 'Basic data gaps' },
    { label: 'Interpretation', usTitle: 'Plain English', themTitle: 'Jargon heavy' },
    { label: 'Barrier to Entry', usTitle: 'Zero experience needed', themTitle: 'Expertise required' },
    { label: 'Cost Investment', usTitle: 'Ultra-low subscription', themTitle: 'High consulting fees' },
  ]

  const iconCheck = '✓'
  const iconCross = '✗'
  const iconSearch = '⌕'
  const iconBolt = '⚡'
  const iconStar = '★'
  const iconDot = '●'

  return (
    <div className="app">
      <section className="hero js-reveal revealed">
        <div className="hero-grid" />
        <h1>
          Stop guessing.<br />
          <span className="accent">AI-powered stock diagnosis</span> in seconds.
        </h1>
        <p>Real-time market insights powered by advanced AI. Make smarter investment decisions with confidence.</p>
        <div className="hero-badges">
          <span className="tag"><span style={{color:'var(--primary)',fontSize:12}}>{iconCheck}</span> 10,000+ investors</span>
          <span className="tag"><span style={{color:'var(--primary)',fontSize:12}}>{iconCheck}</span> Real-time NASDAQ</span>
          <span className="tag"><span style={{color:'var(--primary)',fontSize:12}}>{iconCheck}</span> AI-powered</span>
        </div>
        <div className="search-wrap">
          <div className="search-box">
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:18}}>{iconSearch}</span>
            <input type="text" placeholder="Search any stock symbol (AAPL, TSLA...)" />
          </div>
          <button className="btn-cta" onClick={openPopup}>Diagnose with AI</button>
          <p className="disclaimer">For informational purposes only. Not financial advice.</p>
        </div>
      </section>

      <section className="free-card js-reveal revealed">
        <h2>Free diagnosis — no credit card required</h2>
        <p>Start analyzing stocks today with our AI-powered tools.</p>
        <div className="usage-badge">
          <div className="usage-icon"><span style={{color:'var(--primary)',fontSize:16}}>{iconBolt}</span></div>
          <div>
            <div className="usage-label">Today's free analysis remaining:</div>
            <div className="usage-value">3</div>
          </div>
        </div>
      </section>

      <section className="trending js-reveal revealed">
        <div className="section-head">
          <h2><span className="section-dot" /> Trending Today</h2>
          <span className="section-sub">Auto-updating</span>
        </div>
        <div className="scroll-x" onScroll={(e) => setActiveDot(Math.round(e.target.scrollLeft / e.target.clientWidth))}>
          {stocks.map((s) => (
            <div key={s.symbol} className="stock-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <span className="symbol">{s.symbol}</span>
                <span className="price">{s.price}</span>
              </div>
              <div className="change">{s.change}</div>
            </div>
          ))}
        </div>
        <div className="scroll-dots">
          {stocks.map((_, i) => (<div key={i} className={`scroll-dot${i === activeDot ? ' active' : ''}`} />))}
        </div>
      </section>

      <section className="testimonial js-reveal revealed">
        <h2>Trusted by thousands<br />of investors</h2>
        <div className="testimonial-card">
          <div className="stars">
            {[...Array(5)].map((_, i) => (<span key={i} style={{color:'var(--primary)',fontSize:14}}>{iconStar}</span>))}
          </div>
          <blockquote>"Love how fast I can analyze multiple stocks. The free tier is perfect for getting started."</blockquote>
          <div className="user">
            <div className="user-avatar" style={{background:'linear-gradient(135deg,#FF6B81,#ff8a9e)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18}}>E</div>
            <div>
              <div className="user-name">Emily R.</div>
              <div className="user-role">Data Analyst · Texas</div>
            </div>
          </div>
        </div>
      </section>

      <section className="comparison js-reveal revealed">
        <h2>Our Platform vs. Traditional AI</h2>
        <p className="subtitle">See how we outperform traditional analysis tools</p>
        <div className="comp-table">
          <div style={{overflowX:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="us">Our AI Diagnosis</th>
                  <th className="them">Traditional/Manual</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.label}>
                    <td>{f.label}</td>
                    <td className="us"><div className="check"><span style={{color:'var(--green)',fontSize:18}}>{iconCheck}</span><span>{f.usTitle}</span></div></td>
                    <td className="them"><div className="cross"><span style={{color:'var(--text-muted)',fontSize:18}}>{iconCross}</span><span>{f.themTitle}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="comp-cta">
          <button className="btn-cta" onClick={openPopup}>Start Free Diagnosis</button>
        </div>
      </section>

      <footer className="js-reveal revealed">
        <p className="copy">© 2026 AI Stock Diagnosis Platform</p>
        <p className="edu">For educational purposes only. Not financial advice.</p>
        <div className="footer-links">
          <a onClick={(e) => { e.preventDefault(); document.getElementById('modalPrivacy')?.showModal() }}>Privacy</a>
          <a onClick={(e) => { e.preventDefault(); document.getElementById('modalDisclaimer')?.showModal() }}>Terms</a>
          <a onClick={openPopup}>Contact</a>
        </div>
      </footer>

      <dialog className="modal" id="modalPrivacy">
        <div className="modal-head"><div className="modal-title">Privacy Policy</div><button className="modal-close" onClick={() => document.getElementById('modalPrivacy')?.close()}>Close ×</button></div>
        <div className="modal-body"><h2>1. Information We Collect</h2><p>We collect information you provide directly and technical information sent by your browser.</p><h2>2. How We Use Information</h2><p>We use your information to provide the Service, operate the website, and comply with legal obligations.</p></div>
      </dialog>
      <dialog className="modal" id="modalDisclaimer">
        <div className="modal-head"><div className="modal-title">Terms of Service</div><button className="modal-close" onClick={() => document.getElementById('modalDisclaimer')?.close()}>Close ×</button></div>
        <div className="modal-body"><h2>1. Educational Purposes Only</h2><p>All content is for informational and educational purposes only. Not financial advice.</p><h2>2. No Guarantees</h2><p>Past performance is not a reliable indicator of future results.</p></div>
      </dialog>
    </div>
  )
}

export default App

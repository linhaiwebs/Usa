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
        </div>
      </footer>

      <dialog className="modal" id="modalPrivacy">
        <div className="modal-head">
          <div className="modal-title">Privacy Policy</div>
          <button className="modal-close" onClick={() => document.getElementById('modalPrivacy')?.close()}>Close ×</button>
        </div>
        <div className="modal-body">
          <p className="modal-muted" style={{color:'#6b7280',fontSize:13,marginBottom:16}}>Last updated: May 2026</p>
          <h2>1. Who We Are</h2>
          <p>This website and the AI Stock Diagnosis service are operated by AI Stock Diagnosis Platform ("we", "us" or "our"). If you have questions about this Privacy Policy, you can contact us through the diagnosis form on our site.</p>
          <h2>2. What Information We Collect</h2>
          <h3>a) Information you provide directly</h3>
          <ul><li><strong>Contact details</strong>, such as your name, email address or phone number if you choose to share them.</li><li><strong>Messages and content</strong> that you send to us via the platform (for example, stock symbol queries or feedback).</li></ul>
          <h3>b) Information collected automatically</h3>
          <p>When you visit this website, we may receive basic technical information sent by your browser, including:</p>
          <ul><li>IP address and approximate location (country or city level).</li><li>Date, time and duration of access.</li><li>Pages or files viewed, referrer URL and basic device information (browser type, operating system).</li></ul>
          <h2>3. How We Use Your Information</h2>
          <ul><li><strong>Provide the Service</strong> — to deliver AI-powered stock analysis and respond to your requests.</li><li><strong>Operate and secure the website</strong> — to monitor, maintain and improve the site and protect against abuse.</li><li><strong>Communicate with you</strong> — to send confirmations or follow-up messages related to your inquiries.</li><li><strong>Comply with legal obligations</strong> — to keep records where required by applicable law.</li></ul>
          <h2>4. How We Share Information</h2>
          <p>We do <strong>not</strong> sell your personal information. We may share limited information with service providers who help us operate the website under confidentiality obligations, or with authorities where required by law.</p>
          <h2>5. Your Rights</h2>
          <p>Depending on your location, you may have rights such as access, correction, deletion of your personal information, and the right to object to or restrict certain forms of processing. To exercise these rights, please contact us.</p>
          <h2>6. Security</h2>
          <p>We take reasonable technical and organizational measures to protect personal information. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.</p>
          <h2>7. Changes</h2>
          <p>We may update this Privacy Policy from time to time. When we make material changes, we will adjust the "Last updated" date. Your continued use of the website constitutes acceptance of the revised policy.</p>
        </div>
      </dialog>

      <dialog className="modal" id="modalDisclaimer">
        <div className="modal-head">
          <div className="modal-title">Terms of Service</div>
          <button className="modal-close" onClick={() => document.getElementById('modalDisclaimer')?.close()}>Close ×</button>
        </div>
        <div className="modal-body">
          <p className="modal-muted" style={{color:'#6b7280',fontSize:13,marginBottom:16}}>Last updated: May 2026</p>
          <h2>1. Educational and Informational Purposes Only</h2>
          <p>All content provided on this website (the "Content") is for <strong>general informational and educational purposes only</strong>. Nothing on this website is, or should be interpreted as:</p>
          <ul><li>personalized financial, investment or trading advice;</li><li>a recommendation to buy, sell or hold any security, asset or instrument;</li><li>a solicitation, offer or invitation to engage in any investment strategy.</li></ul>
          <p>The Content does not take into account your individual objectives, financial situation, risk tolerance or needs. You are solely responsible for any investment or trading decisions you make.</p>
          <h2>2. No Guarantees or Promises of Performance</h2>
          <p>The Content may refer to market data, price movements, volatility, or technical indicators. <strong>Past performance, historical patterns or simulated scenarios are not reliable indicators of future results.</strong> We do not guarantee or promise any particular outcome, profit or performance.</p>
          <h2>3. Independent Decisions and Professional Advice</h2>
          <p>Before making any investment, trading or financial decision, you should conduct your own independent research and analysis, and consider consulting a qualified financial, tax or legal professional. You should not rely solely on the Content when deciding whether to invest.</p>
          <h2>4. No Client Relationship</h2>
          <p>The use of this website does <strong>not</strong> create any advisory, fiduciary, client, brokerage or other professional relationship between you and us.</p>
          <h2>5. Data Sources and Accuracy</h2>
          <p>The Content may be based on data from public sources. While we aim to use reliable sources, we cannot guarantee that any information is accurate, complete, up-to-date or error-free. Market data may be delayed or simplified for presentation.</p>
          <h2>6. No Responsibility for Losses</h2>
          <p>To the maximum extent permitted by applicable law, we shall not be liable for any direct, indirect, incidental, consequential or special damages, losses or expenses arising out of or in connection with your use of, or reliance on, the Content.</p>
          <h2>7. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. When we make material changes, we will adjust the "Last updated" date. We encourage you to review this page periodically.</p>
        </div>
      </dialog>
    </div>
  )
}

export default App

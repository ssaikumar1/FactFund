import { Link } from "react-router-dom"
import MouseMoveEffect from "./MouseMoveEffect"
const Landing = () => {
  return (
    <div className="landing-page">
    
      <MouseMoveEffect />
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">FactFund</h1>
          <p className="hero-subtitle">Fund dedicated to verifying, supporting, or promoting factual information</p>
          <div className="hero-buttons">
            <Link to="/explore" className="primary-button">
              Explore Proposals
            </Link>
            <Link to="/createproposal" className="secondary-button">
              Start a Proposal
            </Link>
          </div>
        </div>
        <div className="hero-gradient"></div>
      </section>
      <section className="why-section">
        <div className="section-container">
          <h2 className="section-title">Why FactFund?</h2>
          <p className="section-description">
            Traditional crowdfunding platforms often fall short when it comes to transparency, democratic
            decision-making, and proper tracking of funds. FactFund addresses these issues by leveraging the power of
            the Internet Computer Protocol (ICP) blockchain to create a decentralized, transparent, and secure
            crowdfunding platform.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src="decen2 .png" alt="Decentralization" />
              </div>
              <h3 className="feature-title">Decentralization</h3>
              <p className="feature-description">
                FactFund operates on a decentralized platform, removing the need for intermediaries and ensuring that
                all decisions are made by the community, fostering trust and autonomy.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="trans.png" alt="Transparency" />
              </div>
              <h3 className="feature-title">Transparency</h3>
              <p className="feature-description">
                By leveraging the ICP blockchain, FactFund provides complete transparency in fund management, allowing
                users to track every transaction and see exactly how funds are being utilized.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="security.png" alt="Security" />
              </div>
              <h3 className="feature-title">Security</h3>
              <p className="feature-description">
                FactFund ensures tamper-proof and secure transactions through the use of blockchain technology and the
                Plug wallet, protecting user data and funds from fraud and unauthorized access.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="fee.png" alt="No Hidden Fee" />
              </div>
              <h3 className="feature-title">No Hidden Fee</h3>
              <p className="feature-description">
                Our platform offers no transaction fees, making it cost-effective for users to donate and participate in
                funding projects, ensuring that more of your contributions go directly to the causes you support.
              </p>
            </div>
{/*}
            <div className="feature-card">
              <div className="feature-icon">
                <img src="dao.png" alt="DAO" />
              </div>
              <h3 className="feature-title">DAO</h3>
              <p className="feature-description">
                Decentralized Autonomous Organization empowers the community to govern the platform, enabling users to
                vote on proposals and make collective decisions on fund allocation.
              </p>
            </div>
            */}
          </div>
          
        </div>
      </section>

  
<section className="use-cases-section">
  <div className="section-container">
    <h2 className="section-title">Use Cases</h2>
    <p className="section-subtitle">Discover how FactFund is transforming crowdfunding across different domains</p>
    
    <div className="use-cases-grid">
  
      <div className="use-case-item">
        <div className="use-case-icon">❤️</div>
        <h3 className="use-case-title">Non-Profit Projects</h3>
        <div className="use-case-examples">
          <div className="example-item">
            <span className="example-icon">🏥</span>
            <span className="example-text">Disaster Relief</span>
          </div>
          <div className="example-item">
            <span className="example-icon">🐾</span>
            <span className="example-text">Animal Welfare</span>
          </div>
          <div className="example-item">
            <span className="example-icon">🌱</span>
            <span className="example-text">Environmental Causes</span>
          </div>
          <div className="example-item">
            <span className="example-icon">🏛️</span>
            <span className="example-text">Cultural Preservation</span>
          </div>
        </div>
        <p className="use-case-description">
          Support charitable initiatives that make a real difference in communities around the world.
        </p>
      </div>
      
      {/* Community Initiatives */}
      <div className="use-case-item">
        <div className="use-case-icon">🏙️</div>
        <h3 className="use-case-title">Community Initiatives</h3>
        <div className="use-case-examples">
          <div className="example-item">
            <span className="example-icon">🏫</span>
            <span className="example-text">Local Schools</span>
          </div>
          <div className="example-item">
            <span className="example-icon">🏞️</span>
            <span className="example-text">Public Spaces</span>
          </div>
          <div className="example-item">
            <span className="example-icon">🎭</span>
            <span className="example-text">Arts & Culture</span>
          </div>
          <div className="example-item">
            <span className="example-icon">🏘️</span>
            <span className="example-text">Neighborhood Projects</span>
          </div>
        </div>
        <p className="use-case-description">
          Fund local projects that strengthen communities and improve quality of life for residents.
        </p>
      </div>
      
      {/* Fact-Checking & Journalism */}
      <div className="use-case-item">
        <div className="use-case-icon">📰</div>
        <h3 className="use-case-title">Fact-Checking</h3>
        <div className="use-case-examples">
          <div className="example-item">
            <span className="example-icon">🔍</span>
            <span className="example-text">Investigative Reporting</span>
          </div>
          <div className="example-item">
            <span className="example-icon">📊</span>
            <span className="example-text">Data Journalism</span>
          </div>
          <div className="example-item">
            <span className="example-icon">🌐</span>
            <span className="example-text">Global News Coverage</span>
          </div>
          <div className="example-item">
            <span className="example-icon">📱</span>
            <span className="example-text">Media Literacy</span>
          </div>
        </div>
        <p className="use-case-description">
          Support transparent, fact-based journalism and initiatives that combat misinformation.
        </p>
      </div>
    </div>
  </div>
</section>

      <section className="cta-section">
        <div className="section-container">
          <h2 className="section-title">Join Us Today</h2>
          <p className="section-description">
            Be part of a revolutionary change in crowdfunding. Support the campaigns or proposals you believe in, track
            your donations, and be assured of transparent and democratic decision-making.
          </p>
          <Link to="/explore" className="primary-button">
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <hr class="full-page-line" />
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="logo2.png" alt="FactFund Logo" />
              <span>FactFund</span>
            </div>
            <p>Empowering transparent and decentralized crowdfunding on the Internet Computer Protocol.</p>
          </div>
          <div className="social-links">
            <a href="https://x.com/fact_fund" target="_blank" rel="noopener noreferrer">
              <img src="twitter.png" alt="Twitter" />
            </a>
            <a href="https://www.linkedin.com/company/factfund/" target="_blank" rel="noopener noreferrer">
              <img src="linkedin.png" alt="LinkedIn" />
            </a>
            <a href="https://www.instagram.com/factfund.io/" target="_blank" rel="noopener noreferrer">
              <img src="instagram.png" alt="Instagram" />
            </a>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 FactFund. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

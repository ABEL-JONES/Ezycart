/**
 * Footer component for EzyCart.
 */
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer mt-auto">
      <div className="footer-main py-5">
        <div className="container">
          <div className="row g-4">
            {/* Brand */}
            <div className="col-lg-4 col-md-6">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="brand-icon">
                  <i className="bi bi-cart3"></i>
                </div>
                <span className="brand-text fs-5">EzyCart</span>
              </div>
              <p className="footer-desc">
                Your Shopping, Simplified. Discover thousands of products at unbeatable prices, 
                delivered right to your doorstep.
              </p>
              <div className="social-links d-flex gap-3 mt-3">
                <a href="#" className="social-link" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
                <a href="#" className="social-link" aria-label="Twitter"><i className="bi bi-twitter-x"></i></a>
                <a href="#" className="social-link" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                <a href="#" className="social-link" aria-label="YouTube"><i className="bi bi-youtube"></i></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-lg-2 col-md-6">
              <h6 className="footer-heading">Quick Links</h6>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/categories">Categories</Link></li>
                <li><Link to="/register">Create Account</Link></li>
              </ul>
            </div>

            {/* Customer Support */}
            <div className="col-lg-3 col-md-6">
              <h6 className="footer-heading">Customer Support</h6>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Returns & Refunds</a></li>
                <li><a href="#">Shipping Policy</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-lg-3 col-md-6">
              <h6 className="footer-heading">Contact Us</h6>
              <ul className="footer-links">
                <li>
                  <i className="bi bi-envelope me-2"></i>
                  <a href="mailto:support@ezycart.com">support@ezycart.com</a>
                </li>
                <li>
                  <i className="bi bi-telephone me-2"></i>
                  <a href="tel:+911800000000">1800-000-0000</a>
                </li>
                <li>
                  <i className="bi bi-geo-alt me-2"></i>
                  123 Commerce Lane, Mumbai 400001
                </li>
              </ul>

              {/* Newsletter */}
              <div className="newsletter mt-3">
                <h6 className="footer-heading">Newsletter</h6>
                <form className="d-flex gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    placeholder="Your email"
                    id="newsletter-email"
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <i className="bi bi-send"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="footer-bottom py-3">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <p className="mb-0 footer-copy">
            &copy; {new Date().getFullYear()} EzyCart. All rights reserved.
          </p>
          <div className="payment-icons d-flex gap-2 align-items-center">
            <span className="text-muted small me-1">Payments secured by</span>
            <i className="bi bi-shield-check text-success fs-5"></i>
            <span className="badge bg-secondary">Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

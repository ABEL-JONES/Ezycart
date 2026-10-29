/**
 * Home Page – Hero, Featured Products, Categories, Promotions
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="hero-section">
      <div className="hero-bg">
        <div className="hero-shape-1"></div>
        <div className="hero-shape-2"></div>
        <div className="hero-shape-3"></div>
      </div>
      <div className="container position-relative">
        <div className="row align-items-center min-vh-60">
          <div className="col-lg-6 text-white">
            <span className="hero-badge mb-3 d-inline-block">
              <i className="bi bi-lightning-charge-fill me-1"></i>
              New Arrivals Every Day
            </span>
            <h1 className="hero-title">
              Your Shopping,<br />
              <span className="hero-highlight">Simplified.</span>
            </h1>
            <p className="hero-subtitle">
              Discover thousands of products at unbeatable prices. Fast delivery, 
              easy returns, and secure payments — all in one place.
            </p>
            <div className="d-flex gap-3 flex-wrap">
              <button
                className="btn btn-hero-primary btn-lg"
                onClick={() => navigate('/products')}
                id="shop-now-btn"
              >
                <i className="bi bi-bag-fill me-2"></i>Shop Now
              </button>
              <Link to="/categories" className="btn btn-hero-secondary btn-lg">
                <i className="bi bi-grid me-2"></i>Browse Categories
              </Link>
            </div>
            <div className="hero-stats mt-4 d-flex gap-4 flex-wrap">
              <div className="hero-stat">
                <div className="hero-stat-number">10K+</div>
                <div className="hero-stat-label">Products</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">50K+</div>
                <div className="hero-stat-label">Happy Customers</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">100%</div>
                <div className="hero-stat-label">Secure</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 d-none d-lg-flex justify-content-center">
            <div className="hero-illustration">
              <div className="floating-card card-1">
                <i className="bi bi-bag-check-fill text-primary fs-2"></i>
                <span>Order Placed!</span>
              </div>
              <div className="hero-icon-ring">
                <i className="bi bi-cart3 text-white" style={{fontSize: '5rem'}}></i>
              </div>
              <div className="floating-card card-2">
                <i className="bi bi-star-fill text-warning fs-2"></i>
                <span>5-Star Rated</span>
              </div>
              <div className="floating-card card-3">
                <i className="bi bi-truck text-success fs-2"></i>
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }) {
  const categoryIcons = {
    electronics: 'bi-cpu',
    clothing: 'bi-shirt',
    'home-kitchen': 'bi-house-heart',
    books: 'bi-book',
    'sports-fitness': 'bi-bicycle',
  };
  const icon = categoryIcons[category.slug] || 'bi-tag';

  return (
    <Link to={`/products?category=${category.slug}`} className="text-decoration-none">
      <div className="category-card">
        <div className="category-icon">
          <i className={`bi ${icon}`}></i>
        </div>
        <h6 className="category-name">{category.name}</h6>
        <p className="category-count">{category.product_count} products</p>
      </div>
    </Link>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="col-md-3 col-6">
      <div className="feature-card text-center">
        <div className="feature-icon mb-3">
          <i className={`bi ${icon}`}></i>
        </div>
        <h6 className="feature-title">{title}</h6>
        <p className="feature-desc">{desc}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productsAPI.getProducts({ ordering: '-created_at', page_size: 8 }),
          productsAPI.getCategories(),
        ]);
        const products = prodRes.data.results || prodRes.data;
        setFeaturedProducts(products.slice(0, 4));
        setLatestProducts(products.slice(4, 8));
        setCategories(catRes.data.results || catRes.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home-page">
      <HeroSection />

      {/* Features Strip */}
      <section className="features-strip py-4">
        <div className="container">
          <div className="row g-3">
            <FeatureCard icon="bi-truck" title="Free Shipping" desc="On orders above ₹499" />
            <FeatureCard icon="bi-shield-check" title="Secure Payment" desc="100% protected" />
            <FeatureCard icon="bi-arrow-repeat" title="Easy Returns" desc="30-day return policy" />
            <FeatureCard icon="bi-headset" title="24/7 Support" desc="Always here to help" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section py-5">
        <div className="container">
          <div className="section-header text-center mb-4">
            <span className="section-badge">Browse</span>
            <h2 className="section-title">Popular Categories</h2>
            <p className="section-subtitle">Find everything you need in one place</p>
          </div>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : categories.length > 0 ? (
            <div className="row g-3 justify-content-center">
              {categories.map((cat) => (
                <div key={cat.id} className="col-lg-2 col-md-3 col-4">
                  <CategoryCard category={cat} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No categories found.</p>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <span className="section-badge">Handpicked</span>
              <h2 className="section-title">Featured Products</h2>
            </div>
            <Link to="/products" className="btn btn-outline-primary btn-sm">
              View All <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
          {loading ? (
            <div className="row g-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="col-lg-3 col-md-6">
                  <div className="placeholder-card">
                    <div className="placeholder-image placeholder"></div>
                    <div className="p-3">
                      <div className="placeholder col-4 placeholder-sm mb-1"></div>
                      <div className="placeholder col-8 mb-2"></div>
                      <div className="placeholder col-5 mb-3"></div>
                      <div className="placeholder col-12 placeholder-btn"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="row g-3">
              {featuredProducts.map((product) => (
                <div key={product.id} className="col-lg-3 col-md-6">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state text-center py-5">
              <i className="bi bi-bag-x fs-1 text-muted"></i>
              <p className="mt-2 text-muted">No products available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-section py-5">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-content">
              <span className="promo-label">Limited Time Offer</span>
              <h2 className="promo-title">Up to 50% Off on Electronics!</h2>
              <p className="promo-text">Shop the latest gadgets at incredible prices. Offer ends soon!</p>
              <Link to="/products?category=electronics" className="btn btn-light btn-lg">
                <i className="bi bi-lightning-fill me-2 text-warning"></i>Shop Electronics
              </Link>
            </div>
            <div className="promo-decoration">
              <i className="bi bi-phone fs-1 text-white opacity-25"></i>
              <i className="bi bi-laptop fs-1 text-white opacity-25 ms-3"></i>
              <i className="bi bi-headphones fs-1 text-white opacity-25 ms-3"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="latest-section py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <span className="section-badge">Fresh In</span>
              <h2 className="section-title">Latest Arrivals</h2>
            </div>
            <Link to="/products?ordering=-created_at" className="btn btn-outline-primary btn-sm">
              See More <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
          {!loading && latestProducts.length > 0 ? (
            <div className="row g-3">
              {latestProducts.map((product) => (
                <div key={product.id} className="col-lg-3 col-md-6">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-clock-history fs-2"></i>
              <p className="mt-2">Check back soon for new arrivals!</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section py-5">
        <div className="container">
          <div className="newsletter-card text-center">
            <div className="newsletter-icon mb-3">
              <i className="bi bi-envelope-heart"></i>
            </div>
            <h3 className="newsletter-title">Stay in the Loop</h3>
            <p className="newsletter-text">Subscribe to get exclusive deals, new arrivals, and more!</p>
            <form
              className="newsletter-form d-flex gap-2 justify-content-center flex-wrap"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                className="form-control newsletter-input"
                placeholder="Enter your email address"
                id="home-newsletter-email"
                required
              />
              <button type="submit" className="btn btn-primary btn-newsletter">
                <i className="bi bi-send me-2"></i>Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

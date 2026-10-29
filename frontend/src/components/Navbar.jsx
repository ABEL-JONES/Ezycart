/**
 * Reusable Navbar component for EzyCart.
 * Shows cart count, auth state, and responsive mobile menu.
 */
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cartCount = cart?.item_count || 0;

  return (
    <nav className="navbar navbar-expand-lg sticky-top" id="main-navbar">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <div className="brand-icon">
            <i className="bi bi-cart3"></i>
          </div>
          <span className="brand-text">EzyCart</span>
        </Link>

        {/* Mobile toggler */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-4`}></i>
        </button>

        {/* Nav links */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end onClick={() => setIsOpen(false)}>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/products" onClick={() => setIsOpen(false)}>Products</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/categories" onClick={() => setIsOpen(false)}>Categories</NavLink>
            </li>
            {isAuthenticated && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/orders" onClick={() => setIsOpen(false)}>My Orders</NavLink>
              </li>
            )}
          </ul>

          {/* Right side: search + cart + auth */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Search */}
            <form
              className="d-flex search-form"
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.target.q.value.trim();
                if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
              }}
            >
              <div className="input-group">
                <input
                  type="text"
                  name="q"
                  className="form-control search-input"
                  placeholder="Search products..."
                  aria-label="Search products"
                  id="navbar-search"
                />
                <button className="btn btn-search" type="submit" aria-label="Search">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </form>

            {/* Cart */}
            <Link to="/cart" className="btn btn-cart position-relative" aria-label="Shopping cart" id="cart-btn">
              <i className="bi bi-cart3 fs-5"></i>
              {cartCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill cart-badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth buttons */}
            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="btn btn-user dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  id="user-dropdown-btn"
                >
                  <div className="avatar-circle">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="d-none d-md-inline">{user?.full_name?.split(' ')[0]}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                  <li className="dropdown-header">
                    <strong>{user?.full_name}</strong>
                    <div className="text-muted small">{user?.email}</div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person me-2"></i>Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/orders">
                      <i className="bi bi-bag me-2"></i>My Orders
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout} id="logout-btn">
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-primary btn-sm" id="login-nav-btn">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm" id="register-nav-btn">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

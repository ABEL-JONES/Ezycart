/**
 * LoginPage – email + password login with JWT.
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email or username is required.';
    if (!form.password) newErrors.password = 'Password is required.';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      await login(form.email.trim(), form.password);
      await fetchCart();
      navigate(from, { replace: true });
    } catch (err) {
      if (!err.response) {
        setErrors({ general: 'Cannot connect to backend server. Please verify backend is running on http://127.0.0.1:8000.' });
      } else {
        const data = err.response?.data;
        if (data?.detail) {
          setErrors({ general: data.detail });
        } else if (typeof data === 'object') {
          const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' | ');
          setErrors({ general: msg || 'Invalid email/username or password. Please try again.' });
        } else {
          setErrors({ general: 'Invalid email/username or password. Please try again.' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className="auth-left d-none d-lg-flex">
        <div className="auth-left-content">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="brand-icon brand-icon-lg"><i className="bi bi-cart3"></i></div>
            <span className="brand-text fs-3 text-white">EzyCart</span>
          </div>
          <h2 className="text-white mb-3">Welcome back!</h2>
          <p className="text-white opacity-75 mb-4">
            Sign in to access your cart, track orders, and enjoy personalized shopping.
          </p>
          <div className="auth-features">
            {[
              { icon: 'bi-shield-check', text: 'Secure & encrypted' },
              { icon: 'bi-truck', text: 'Fast delivery tracking' },
              { icon: 'bi-bag-heart', text: 'Personalized recommendations' },
            ].map((f) => (
              <div key={f.text} className="auth-feature d-flex align-items-center gap-2 mb-2">
                <i className={`bi ${f.icon} text-white`}></i>
                <span className="text-white opacity-75">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="d-lg-none text-center mb-4">
            <div className="brand-icon mx-auto mb-2"><i className="bi bi-cart3"></i></div>
            <h5 className="brand-text">EzyCart</h5>
          </div>

          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Enter your credentials to continue shopping</p>

          {/* Quick Demo Credentials */}
          <div className="alert alert-light border shadow-sm p-3 mb-3 rounded-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-bold text-muted"><i className="bi bi-key-fill me-1 text-primary"></i>Quick Demo Accounts:</span>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => fillDemo('customer@ezycart.com', 'Customer123!')}
              >
                <i className="bi bi-person me-1"></i>Customer Demo
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => fillDemo('admin@ezycart.com', 'Admin123!')}
              >
                <i className="bi bi-shield-lock me-1"></i>Admin Demo
              </button>
            </div>
          </div>

          {errors.general && (
            <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate id="login-form">
            {/* Email or Username */}
            <div className="mb-3">
              <label className="form-label" htmlFor="login-email">Email or Username</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  id="login-email"
                  name="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="customer@ezycart.com or username"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <div className="d-flex justify-content-between">
                <label className="form-label" htmlFor="login-password">Password</label>
              </div>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  id="toggle-password-btn"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 btn-lg"
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>Don't have an account?</span></div>

          <Link to="/register" className="btn btn-outline-primary w-100" id="go-to-register-btn">
            <i className="bi bi-person-plus me-2"></i>Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

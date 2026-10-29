/**
 * RegisterPage – full registration form with validation.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = 'Full name is required.';
    if (!form.email) newErrors.email = 'Email is required.';
    if (!form.username.trim()) newErrors.username = 'Username is required.';
    if (!form.password) newErrors.password = 'Password is required.';
    if (!form.password_confirm) newErrors.password_confirm = 'Please confirm your password.';
    if (form.password && form.password_confirm && form.password !== form.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match.';
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    try {
      setLoading(true);
      setErrors({});
      await authAPI.register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      if (!err.response) {
        setErrors({ general: 'Cannot connect to backend server. Please verify backend is running on http://127.0.0.1:8000.' });
      } else {
        const data = err.response?.data || {};
        const fieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value.join(' ') : value;
        });
        if (data.detail) fieldErrors.general = data.detail;
        if (data.non_field_errors) fieldErrors.general = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : data.non_field_errors;
        if (!Object.keys(fieldErrors).length) fieldErrors.general = 'Registration failed. Please check your inputs.';
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-right" style={{ width: '100%' }}>
          <div className="auth-form-container text-center">
            <div className="success-icon mb-3">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
            </div>
            <h3>Account Created!</h3>
            <p className="text-muted">Your account has been created successfully. Redirecting to login...</p>
            <div className="spinner-border text-primary mt-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-left d-none d-lg-flex">
        <div className="auth-left-content">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="brand-icon brand-icon-lg"><i className="bi bi-cart3"></i></div>
            <span className="brand-text fs-3 text-white">EzyCart</span>
          </div>
          <h2 className="text-white mb-3">Join EzyCart Today</h2>
          <p className="text-white opacity-75 mb-4">
            Create your free account and start shopping thousands of products with exclusive member deals.
          </p>
          <div className="auth-features">
            {[
              { icon: 'bi-tag', text: 'Exclusive member discounts' },
              { icon: 'bi-heart', text: 'Save your wishlist' },
              { icon: 'bi-clock-history', text: 'Track all your orders' },
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

          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join thousands of happy shoppers</p>

          {(errors.general || errors.non_field_errors) && (
            <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{errors.general || errors.non_field_errors}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate id="register-form">
            {/* Full Name */}
            <div className="mb-3">
              <label className="form-label" htmlFor="reg-full-name">Full Name</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  id="reg-full-name"
                  name="full_name"
                  className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
                {errors.full_name && <div className="invalid-feedback">{errors.full_name}</div>}
              </div>
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  id="reg-email"
                  name="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            {/* Username */}
            <div className="mb-3">
              <label className="form-label" htmlFor="reg-username">Username</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-at"></i></span>
                <input
                  type="text"
                  id="reg-username"
                  name="username"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="johndoe123"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  id="reg-password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(!showPass)} id="toggle-pass-btn">
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="reg-confirm"
                  name="password_confirm"
                  className={`form-control ${errors.password_confirm ? 'is-invalid' : ''}`}
                  placeholder="Repeat your password"
                  value={form.password_confirm}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowConfirm(!showConfirm)} id="toggle-confirm-btn">
                  <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
                {errors.password_confirm && <div className="invalid-feedback">{errors.password_confirm}</div>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading} id="register-submit-btn">
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Creating account...</>
              ) : (
                <><i className="bi bi-person-plus me-2"></i>Create Account</>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>
          <Link to="/login" className="btn btn-outline-primary w-100" id="go-to-login-btn">
            <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

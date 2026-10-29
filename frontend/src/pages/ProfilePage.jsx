/**
 * ProfilePage – view/update profile and change password.
 */
import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile form
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '', username: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    authAPI.getProfile().then((r) => {
      setProfile({ full_name: r.data.full_name, phone: r.data.phone || '', email: r.data.email, username: r.data.username });
    }).catch(() => {});
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setProfileErrors({ ...profileErrors, [e.target.name]: '' });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileErrors({});
      const res = await authAPI.updateProfile({ full_name: profile.full_name, phone: profile.phone });
      updateUser({ full_name: res.data.full_name, phone: res.data.phone });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      const data = err.response?.data || {};
      const errs = {};
      Object.entries(data).forEach(([k, v]) => { errs[k] = Array.isArray(v) ? v[0] : v; });
      setProfileErrors(errs);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
    setPwErrors({ ...pwErrors, [e.target.name]: '' });
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }
    try {
      setPwSaving(true);
      setPwErrors({});
      await authAPI.changePassword(pwForm);
      setPwSuccess(true);
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      const data = err.response?.data || {};
      const errs = {};
      Object.entries(data).forEach(([k, v]) => { errs[k] = Array.isArray(v) ? v[0] : v; });
      setPwErrors(errs);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="profile-page py-4">
      <div className="container" style={{ maxWidth: '860px' }}>
        <div className="page-header mb-4">
          <h1 className="page-title">My Profile</h1>
          <p className="text-muted">Manage your account information and security settings</p>
        </div>

        {/* Avatar */}
        <div className="profile-avatar-card mb-4">
          <div className="profile-avatar">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className="mb-0">{user?.full_name}</h4>
            <p className="text-muted mb-0">{user?.email}</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="checkout-card mb-4">
          <h5 className="card-section-title">
            <i className="bi bi-person me-2 text-primary"></i>Personal Information
          </h5>
          {profileSuccess && (
            <div className="alert alert-success py-2">
              <i className="bi bi-check-circle me-2"></i>Profile updated successfully!
            </div>
          )}
          <form onSubmit={handleProfileSave} id="profile-form">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="prof-full-name">Full Name</label>
                <input
                  type="text" id="prof-full-name" name="full_name"
                  className={`form-control ${profileErrors.full_name ? 'is-invalid' : ''}`}
                  value={profile.full_name} onChange={handleProfileChange}
                />
                {profileErrors.full_name && <div className="invalid-feedback">{profileErrors.full_name}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="prof-phone">Phone Number</label>
                <input
                  type="tel" id="prof-phone" name="phone"
                  className={`form-control ${profileErrors.phone ? 'is-invalid' : ''}`}
                  value={profile.phone} onChange={handleProfileChange}
                  placeholder="9876543210"
                />
                {profileErrors.phone && <div className="invalid-feedback">{profileErrors.phone}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="prof-email">Email Address</label>
                <input type="email" id="prof-email" className="form-control" value={profile.email} readOnly disabled />
                <div className="form-text">Email cannot be changed.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="prof-username">Username</label>
                <input type="text" id="prof-username" className="form-control" value={profile.username} readOnly disabled />
                <div className="form-text">Username cannot be changed.</div>
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-primary" disabled={profileSaving} id="save-profile-btn">
                {profileSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check-lg me-2"></i>Save Changes</>}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="checkout-card">
          <h5 className="card-section-title">
            <i className="bi bi-shield-lock me-2 text-primary"></i>Change Password
          </h5>
          {pwSuccess && (
            <div className="alert alert-success py-2">
              <i className="bi bi-check-circle me-2"></i>Password changed successfully!
            </div>
          )}
          <form onSubmit={handlePwSave} id="change-password-form">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="old-password">Current Password</label>
                <input
                  type="password" id="old-password" name="old_password"
                  className={`form-control ${pwErrors.old_password ? 'is-invalid' : ''}`}
                  value={pwForm.old_password} onChange={handlePwChange}
                  autoComplete="current-password"
                />
                {pwErrors.old_password && <div className="invalid-feedback">{pwErrors.old_password}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <input
                  type="password" id="new-password" name="new_password"
                  className={`form-control ${pwErrors.new_password ? 'is-invalid' : ''}`}
                  value={pwForm.new_password} onChange={handlePwChange}
                  autoComplete="new-password"
                />
                {pwErrors.new_password && <div className="invalid-feedback">{pwErrors.new_password}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                <input
                  type="password" id="confirm-password" name="confirm_password"
                  className={`form-control ${pwErrors.confirm_password ? 'is-invalid' : ''}`}
                  value={pwForm.confirm_password} onChange={handlePwChange}
                  autoComplete="new-password"
                />
                {pwErrors.confirm_password && <div className="invalid-feedback">{pwErrors.confirm_password}</div>}
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-warning" disabled={pwSaving} id="change-password-btn">
                {pwSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Changing...</> : <><i className="bi bi-lock me-2"></i>Change Password</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

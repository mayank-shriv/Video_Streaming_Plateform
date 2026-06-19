import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { FiPlay } from 'react-icons/fi';
import styles from './Auth.module.css';

export default function Login() {
  const { isAuthenticated, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to home
  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/home" replace />;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.identifier.trim() || !formData.password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      // Smart detection: @ means email, otherwise username
      const isEmail = formData.identifier.includes('@');
      const credentials = {
        [isEmail ? 'email' : 'username']: formData.identifier.trim(),
        password: formData.password,
      };

      await login(credentials);
      navigate('/home', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      {/* Animated background blobs */}
      <div className={styles.blobRed} />
      <div className={styles.blobPurple} />

      <div className={styles.authCard}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <FiPlay />
          </div>
          <span className={styles.logoName}>ViewTube</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styles.alertError}>
            <HiOutlineExclamationTriangle className={styles.alertIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Username / Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">Username or Email</label>
            <div className={styles.inputWrapper}>
              <input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="Enter your username or email"
                value={formData.identifier}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading && <span className={styles.spinner} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/register" className={styles.footerLink}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

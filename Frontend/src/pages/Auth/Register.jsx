import { useState, useRef, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { FiPlay, FiUploadCloud } from 'react-icons/fi';
import styles from './Auth.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // If already authenticated, redirect
  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/home" replace />;

  /* ── Helpers ──────────────────────────── */
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleFileSelect = (file, type) => {
    if (!file || !file.type.startsWith('image/')) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatar(file);
      setAvatarPreview(previewUrl);
    } else {
      setCoverImage(file);
      setCoverPreview(previewUrl);
    }
    if (error) setError('');
  };

  const removeFile = (type) => {
    if (type === 'avatar') {
      setAvatar(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    } else {
      setCoverImage(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
  };

  /* ── Drag & Drop handlers ────────────── */
  const makeDragHandlers = (type) => ({
    onDragOver: (e) => {
      e.preventDefault();
      type === 'avatar' ? setAvatarDragOver(true) : setCoverDragOver(true);
    },
    onDragLeave: () => {
      type === 'avatar' ? setAvatarDragOver(false) : setCoverDragOver(false);
    },
    onDrop: (e) => {
      e.preventDefault();
      type === 'avatar' ? setAvatarDragOver(false) : setCoverDragOver(false);
      const file = e.dataTransfer.files?.[0];
      handleFileSelect(file, type);
    },
  });

  /* ── Validation ──────────────────────── */
  const validateStep1 = () => {
    if (!formData.fullname.trim()) return 'Full name is required.';
    if (!formData.email.trim()) return 'Email is required.';
    if (!EMAIL_REGEX.test(formData.email)) return 'Please enter a valid email address.';
    if (!formData.username.trim()) return 'Username is required.';
    if (formData.username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const validateStep2 = () => {
    if (!avatar) return 'Avatar image is required.';
    if (!coverImage) return 'Cover image is required.';
    return null;
  };

  /* ── Step Navigation ─────────────────── */
  const handleContinue = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  /* ── Submit ──────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('fullname', formData.fullname.trim());
      data.append('email', formData.email.trim());
      data.append('username', formData.username.trim());
      data.append('password', formData.password);
      data.append('avatar', avatar);
      data.append('coverImage', coverImage);

      await authService.register(data);

      setSuccess('Account created successfully! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render helpers ──────────────────── */
  const renderUploadZone = (type) => {
    const file = type === 'avatar' ? avatar : coverImage;
    const preview = type === 'avatar' ? avatarPreview : coverPreview;
    const isDragOver = type === 'avatar' ? avatarDragOver : coverDragOver;
    const inputRef = type === 'avatar' ? avatarInputRef : coverInputRef;
    const label = type === 'avatar' ? 'Avatar' : 'Cover Image';

    return (
      <div className={styles.inputGroup}>
        <label>{label} *</label>
        <div
          className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragover : ''} ${
            file ? styles.uploadAreaHasFile : ''
          }`}
          onClick={() => inputRef.current?.click()}
          {...makeDragHandlers(type)}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className={styles.uploadInput}
            onChange={(e) => handleFileSelect(e.target.files?.[0], type)}
          />

          {preview ? (
            <div className={styles.filePreview}>
              <img src={preview} alt={`${label} preview`} />
              <button
                type="button"
                className={styles.removeFile}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(type);
                }}
                aria-label={`Remove ${label}`}
              >
                <HiOutlineXMark size={14} />
              </button>
            </div>
          ) : (
            <>
              <FiUploadCloud className={styles.uploadIcon} />
              <div className={styles.uploadText}>
                <strong>Click to upload</strong> or drag and drop
              </div>
              <div className={styles.uploadHint}>PNG, JPG, WEBP up to 5MB</div>
            </>
          )}
        </div>
      </div>
    );
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

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {/* Step 1 */}
          <div className={`${styles.step} ${step === 1 ? styles.stepActive : ''} ${step > 1 ? styles.stepCompleted : ''}`}>
            <div className={styles.stepCircle}>
              {step > 1 ? <HiOutlineCheck size={16} /> : '1'}
            </div>
            <span className={styles.stepLabel}>Details</span>
          </div>

          {/* Connector */}
          <div className={`${styles.stepConnector} ${step > 1 ? styles.stepConnectorActive : ''}`} />

          {/* Step 2 */}
          <div className={`${styles.step} ${step === 2 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>2</div>
            <span className={styles.stepLabel}>Images</span>
          </div>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <h1>{step === 1 ? 'Create Account' : 'Upload Images'}</h1>
          <p>
            {step === 1
              ? 'Fill in your details to get started'
              : 'Add your avatar and cover image'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className={styles.alertError}>
            <HiOutlineExclamationTriangle className={styles.alertIcon} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles.alertSuccess}>
            <HiOutlineCheckCircle className={styles.alertIcon} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {step === 1 && (
            <>
              {/* Full Name */}
              <div className={styles.inputGroup}>
                <label htmlFor="fullname">Full Name</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullname}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Username */}
              <div className={styles.inputGroup}>
                <label htmlFor="username">Username</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="cooluser123"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
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
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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

              {/* Continue */}
              <button type="button" className={styles.submitBtn} onClick={handleContinue}>
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {renderUploadZone('avatar')}
              {renderUploadZone('cover')}

              {/* Buttons */}
              <div className={styles.buttonRow}>
                <button type="button" className={styles.backBtn} onClick={handleBack} disabled={loading}>
                  Back
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading && <span className={styles.spinner} />}
                  {loading ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.footerLink}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

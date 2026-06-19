import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiSun, FiMoon, FiMonitor, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await userService.updateAvatar(formData);
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update avatar');
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('coverImage', file);
      const res = await userService.updateCover(formData);
      updateUser({ coverImage: res.data.data.coverImage });
      toast.success('Cover image updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cover');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullname.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await userService.updateAccount({ fullname: fullname.trim(), email: email.trim() });
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return toast.error('All fields are required');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setChangingPw(true);
    try {
      await userService.changePassword({ oldPassword, newPassword });
      toast.success('Password changed!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const getInitial = () => {
    return user?.fullname?.charAt(0)?.toUpperCase() || '?';
  };

  const tabs = ['profile', 'account', 'appearance'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          {/* Avatar */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Profile Photo</h3>
            <p className={styles.sectionDesc}>This will be displayed on your profile and videos</p>
            <div className={styles.imageSection}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.fullname} className={styles.avatarPreview} />
              ) : (
                <div className={styles.avatarFallback}>{getInitial()}</div>
              )}
              <div className={styles.imageInfo}>
                <h4>Avatar</h4>
                <p>Recommended: 256x256px, JPG or PNG</p>
                <button className={styles.changeBtn} onClick={() => avatarInputRef.current?.click()}>
                  <FiCamera size={16} /> Change Avatar
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Cover Image</h3>
            <p className={styles.sectionDesc}>Displayed at the top of your channel page</p>
            {user?.coverImage ? (
              <img src={user.coverImage} alt="Cover" className={styles.coverPreview} />
            ) : (
              <div className={styles.coverFallback}>No cover image</div>
            )}
            <button className={styles.changeBtn} onClick={() => coverInputRef.current?.click()}>
              <FiCamera size={16} /> Change Cover
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleCoverChange}
            />
          </div>

          {/* Profile Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Profile Details</h3>
            <form className={styles.form} onSubmit={handleSaveProfile}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input type="text" value={user?.username || ''} disabled />
              </div>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? <div className="spinner" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Change Password</h3>
            <p className={styles.sectionDesc}>Update your password to keep your account secure</p>
            <form className={styles.form} onSubmit={handleChangePassword}>
              <div className={styles.formGroup}>
                <label>Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className={styles.formGroup}>
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <button type="submit" className={styles.saveBtn} disabled={changingPw}>
                {changingPw ? <div className="spinner" /> : 'Change Password'}
              </button>
            </form>
          </div>

          <div className={styles.dangerZone}>
            <h3>Danger Zone</h3>
            <p>Sign out from all devices. You will need to log in again.</p>
            <button className={styles.dangerBtn} onClick={handleLogout}>
              <FiLogOut size={16} /> Sign Out Everywhere
            </button>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Theme</h3>
            <p className={styles.sectionDesc}>Choose your preferred appearance</p>
            <div className={styles.themeGrid}>
              <div
                className={`${styles.themeCard} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => setTheme('dark')}
              >
                <div className={`${styles.themeIcon} ${styles.darkIcon}`}>
                  <FiMoon />
                </div>
                <h4>Dark</h4>
                <p>Easy on the eyes</p>
              </div>
              <div
                className={`${styles.themeCard} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => setTheme('light')}
              >
                <div className={`${styles.themeIcon} ${styles.lightIcon}`}>
                  <FiSun />
                </div>
                <h4>Light</h4>
                <p>Classic bright look</p>
              </div>
              <div
                className={`${styles.themeCard} ${theme === 'system' ? styles.active : ''}`}
                onClick={() => setTheme('system')}
              >
                <div className={`${styles.themeIcon} ${styles.systemIcon}`}>
                  <FiMonitor />
                </div>
                <h4>System</h4>
                <p>Match your device</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

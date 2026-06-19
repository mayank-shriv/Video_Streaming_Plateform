import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiUpload, FiBell, FiUser, FiSettings, FiLogOut, FiPlay } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { userService, formatTimeAgo } from '../../services/api';
import styles from './Navbar.module.css';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // ─── Search State ───
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Dropdown States ───
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // ─── Notifications ───
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Refs for outside-click ───
  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Fetch notifications on mount (authenticated only)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const res = await userService.getNotifications();
        const data = res.data?.data || [];
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      } catch {
        // Silently fail — notifications are non-critical
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

  // Close dropdowns on outside click
  const handleOutsideClick = useCallback((e) => {
    if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
      setShowUserDropdown(false);
    }
    if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
      setShowNotifDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  // ─── Handlers ───
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/home?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSignOut = async () => {
    setShowUserDropdown(false);
    await logout();
    navigate('/');
  };

  const handleMarkAllRead = async () => {
    try {
      await userService.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  };

  const toggleNotifDropdown = () => {
    setShowNotifDropdown((prev) => !prev);
    setShowUserDropdown(false);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown((prev) => !prev);
    setShowNotifDropdown(false);
  };

  // ─── Avatar helpers ───
  const avatarUrl = user?.avatar;
  const initials = user?.fullname
    ? user.fullname
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <nav className={styles.navbar}>
      {/* ═══ LEFT ═══ */}
      <div className={styles.leftSection}>
        <button
          className={styles.menuBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FiMenu />
        </button>

        <Link to={isAuthenticated ? '/home' : '/'} className={styles.logo}>
          <div className={styles.logoIcon}>
            <FiPlay />
          </div>
          <span className={styles.logoText}>ViewTube</span>
        </Link>
      </div>

      {/* ═══ CENTER — Search ═══ */}
      <div className={styles.centerSection}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn} aria-label="Search">
              <FiSearch />
            </button>
          </div>
        </form>
      </div>

      {/* ═══ RIGHT ═══ */}
      <div className={styles.rightSection}>
        {isAuthenticated ? (
          <>
            {/* Upload */}
            <Link to="/upload" className={styles.iconBtn} aria-label="Upload video">
              <FiUpload />
            </Link>

            {/* Notifications */}
            <div className={styles.notifContainer} ref={notifDropdownRef}>
              <button
                className={styles.iconBtn}
                onClick={toggleNotifDropdown}
                aria-label="Notifications"
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className={styles.badge}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span className={styles.notifTitle}>Notifications</span>
                    {unreadCount > 0 && (
                      <button className={styles.markReadBtn} onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length > 0 ? (
                      notifications.slice(0, 20).map((notif) => (
                        <div
                          key={notif._id}
                          className={`${styles.notifItem} ${!notif.isRead ? styles.unread : ''}`}
                        >
                          <div className={styles.notifAvatar}>
                            {notif.sender?.avatar ? (
                              <img src={notif.sender.avatar} alt="" />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  background: 'var(--accent-gradient)',
                                  borderRadius: 'var(--radius-full)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                }}
                              >
                                <FiUser />
                              </div>
                            )}
                          </div>
                          <div className={styles.notifContent}>
                            <p className={styles.notifMessage}>
                              <strong>{notif.sender?.fullname || 'Someone'}</strong>{' '}
                              {notif.message || 'sent you a notification'}
                            </p>
                            <span className={styles.notifTime}>
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.notifEmpty}>
                        <div className={styles.notifEmptyIcon}>
                          <FiBell />
                        </div>
                        <p>No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar + Dropdown */}
            <div className={styles.dropdownContainer} ref={userDropdownRef}>
              <button
                className={`${styles.avatarBtn} ${showUserDropdown ? styles.active : ''}`}
                onClick={toggleUserDropdown}
                aria-label="User menu"
              >
                {avatarUrl ? (
                  <img className={styles.avatarImg} src={avatarUrl} alt={user?.fullname} />
                ) : (
                  <div className={styles.avatarFallback}>{initials}</div>
                )}
              </button>

              {showUserDropdown && (
                <div className={styles.dropdown}>
                  {/* Header */}
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownAvatar}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={user?.fullname} />
                      ) : (
                        <div className={styles.avatarFallback}>{initials}</div>
                      )}
                    </div>
                    <div className={styles.dropdownUserInfo}>
                      <div className={styles.dropdownName}>{user?.fullname}</div>
                      <div className={styles.dropdownEmail}>{user?.email}</div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className={styles.dropdownMenu}>
                    <Link
                      to={`/channel/${user?.username}`}
                      className={styles.dropdownItem}
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <FiUser /> Your Channel
                    </Link>
                    <Link
                      to="/settings"
                      className={styles.dropdownItem}
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <FiSettings /> Settings
                    </Link>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.danger}`}
                      onClick={handleSignOut}
                    >
                      <FiLogOut /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.authBtns}>
            <Link to="/login" className={styles.signInBtn}>
              <FiUser /> Sign In
            </Link>
            <Link to="/register" className={styles.signUpBtn}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

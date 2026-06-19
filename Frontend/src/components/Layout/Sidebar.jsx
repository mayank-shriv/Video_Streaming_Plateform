import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  FiHome,
  FiTrendingUp,
  FiUsers,
  FiFilm,
  FiClock,
  FiThumbsUp,
  FiUpload,
  FiSettings,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const mainItems = [
  { icon: FiHome, label: 'Home', path: '/home', matchExact: true },
  { icon: FiTrendingUp, label: 'Trending', path: '/home?tab=trending' },
  { icon: FiUsers, label: 'Subscriptions', path: '/home?tab=subscriptions' },
];

const libraryItems = (username) => [
  { icon: FiFilm, label: 'Your Videos', path: `/channel/${username}` },
  { icon: FiClock, label: 'History', path: '/home?tab=history' },
  { icon: FiThumbsUp, label: 'Liked Videos', path: '/home?tab=liked' },
];

const youItems = [
  { icon: FiUpload, label: 'Upload', path: '/upload' },
  { icon: FiSettings, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const username = user?.username || '';

  // Determine active state
  const isActive = (item) => {
    // Items with query params (e.g. /home?tab=trending)
    if (item.path.includes('?')) {
      const [basePath, queryString] = item.path.split('?');
      const params = new URLSearchParams(queryString);

      if (location.pathname !== basePath) return false;

      // Check every param key=value
      for (const [key, value] of params.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }

    // Exact match items (like Home)
    if (item.matchExact) {
      return location.pathname === item.path && !searchParams.get('tab') && !searchParams.get('search');
    }

    // Simple pathname match
    return location.pathname === item.path;
  };

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    mobileOpen ? styles.mobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item);

    return (
      <Link
        key={item.label}
        to={item.path}
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        data-tooltip={item.label}
        onClick={() => {
          // Close mobile sidebar on navigation
          if (mobileOpen) onClose?.();
        }}
      >
        <span className={styles.navIcon}>
          <Icon />
        </span>
        <span className={styles.navLabel}>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.visible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={sidebarClass}>
        {/* Main section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Main</div>
          {mainItems.map(renderItem)}
        </div>

        {/* Library section (auth only) */}
        {isAuthenticated && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Library</div>
            {libraryItems(username).map(renderItem)}
          </div>
        )}

        {/* You section (auth only) */}
        {isAuthenticated && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>You</div>
            {youItems.map(renderItem)}
          </div>
        )}
      </aside>
    </>
  );
}

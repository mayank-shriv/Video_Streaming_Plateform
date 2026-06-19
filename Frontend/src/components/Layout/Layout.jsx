import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ─── Responsive: detect mobile ───
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);

    if (mobile) {
      setSidebarCollapsed(true);
      setMobileOpen(false);
    }
  }, []);

  useEffect(() => {
    handleResize(); // run once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // ─── Toggle handler passed to Navbar ───
  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  // ─── Main content class ───
  const mainContentClass = [
    styles.mainContent,
    sidebarCollapsed && !isMobile ? styles.mainContentCollapsed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.layout}>
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onClose={handleCloseMobile}
      />
      <main className={mainContentClass}>
        <Outlet />
      </main>
    </div>
  );
}

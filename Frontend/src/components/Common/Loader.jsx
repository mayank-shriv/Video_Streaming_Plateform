import styles from './Loader.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={`${styles.skeletonThumbnail} skeleton`} />
      <div className={styles.skeletonInfo}>
        <div className={`${styles.skeletonAvatar} skeleton`} />
        <div className={styles.skeletonText}>
          <div className={`${styles.skeletonLine} ${styles.lineTitle} skeleton`} />
          <div className={`${styles.skeletonLine} ${styles.lineTitleShort} skeleton`} />
          <div className={`${styles.skeletonLine} ${styles.lineMeta} skeleton`} />
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = 24, className = '' }) {
  return (
    <div
      className={`spinner ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

export function PageLoader() {
  return (
    <div className={styles.pageLoader}>
      <Spinner size={40} />
    </div>
  );
}

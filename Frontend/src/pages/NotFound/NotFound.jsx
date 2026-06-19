import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <span className={styles.watermark}>VT</span>

      <div className={styles.content}>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.heading}>Page Not Found</h2>
        <p className={styles.description}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className={styles.homeBtn}>
          <FiHome />
          Go Home
        </Link>
      </div>
    </div>
  );
}

import { Spinner } from './Loader';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className={styles.spinnerWrap}>
          <Spinner size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        </span>
      )}
      <span className={`${styles.content} ${loading ? styles.contentHidden : ''}`}>
        {children}
      </span>
    </button>
  );
}

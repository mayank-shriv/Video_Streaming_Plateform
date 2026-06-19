import { useState } from 'react';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';
import styles from './Input.module.css';

export default function Input({
  label,
  error,
  type = 'text',
  icon: Icon,
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const isTextarea = type === 'textarea';

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const wrapperClasses = [
    styles.wrapper,
    error ? styles.hasError : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputGroup}>
        {Icon && (
          <span className={styles.iconLeft}>
            <Icon />
          </span>
        )}
        {isTextarea ? (
          <textarea
            className={`${styles.input} ${styles.textarea} ${Icon ? styles.hasIconLeft : ''}`}
            {...rest}
          />
        ) : (
          <input
            type={inputType}
            className={`${styles.input} ${Icon ? styles.hasIconLeft : ''} ${isPassword ? styles.hasIconRight : ''}`}
            {...rest}
          />
        )}
        {isPassword && (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <HiEyeSlash /> : <HiEye />}
          </button>
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

import styles from './Avatar.module.css';

const gradients = [
  'linear-gradient(135deg, #ff4444 0%, #ff8800 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || '?';
}

function getGradient(name) {
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function Avatar({ src, alt, size = 36, className = '' }) {
  const sizeStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    fontSize: `${Math.max(size * 0.38, 11)}px`,
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`${styles.avatar} ${className}`}
        style={sizeStyle}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${styles.avatar} ${styles.fallback} ${className}`}
      style={{
        ...sizeStyle,
        background: getGradient(alt),
      }}
      title={alt}
    >
      {getInitials(alt)}
    </div>
  );
}

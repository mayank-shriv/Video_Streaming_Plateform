import { Link } from 'react-router-dom';
import { HiPlay } from 'react-icons/hi2';
import Avatar from '../Common/Avatar';
import { formatViews, formatTimeAgo, formatDuration } from '../../services/api';
import styles from './VideoCard.module.css';

export default function VideoCard({ video }) {
  if (!video) return null;

  const {
    _id,
    title,
    thumbnail,
    duration,
    views,
    owner,
    createdAt,
  } = video;

  return (
    <div className={styles.card}>
      <Link to={`/watch/${_id}`} className={styles.thumbnailLink}>
        <div className={styles.thumbnailContainer}>
          <img
            src={thumbnail}
            alt={title}
            className={styles.thumbnail}
            loading="lazy"
          />
          <div className={styles.overlay}>
            <div className={styles.playIcon}>
              <HiPlay />
            </div>
          </div>
          {duration != null && (
            <span className={styles.duration}>
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </Link>

      <div className={styles.info}>
        <Link
          to={`/channel/${owner?.username}`}
          className={styles.avatarLink}
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            src={owner?.avatar}
            alt={owner?.fullname || owner?.username}
            size={36}
          />
        </Link>

        <div className={styles.details}>
          <Link to={`/watch/${_id}`} className={styles.titleLink}>
            <h3 className={styles.title}>{title}</h3>
          </Link>
          <Link
            to={`/channel/${owner?.username}`}
            className={styles.channelName}
          >
            {owner?.fullname || owner?.username}
          </Link>
          <div className={styles.meta}>
            <span>{formatViews(views)} views</span>
            <span className={styles.dot}>•</span>
            <span>{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

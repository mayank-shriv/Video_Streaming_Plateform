import VideoCard from './VideoCard';
import { SkeletonCard } from '../Common/Loader';
import EmptyState from '../Common/EmptyState';
import { HiVideoCamera } from 'react-icons/hi2';
import styles from './VideoGrid.module.css';

export default function VideoGrid({
  videos = [],
  loading = false,
  emptyMessage = 'No videos found',
}) {
  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!videos.length) {
    return (
      <EmptyState
        icon={<HiVideoCamera />}
        title={emptyMessage}
        description="Looks like there's nothing here yet. Check back later or explore other content."
      />
    );
  }

  return (
    <div className={styles.grid}>
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}

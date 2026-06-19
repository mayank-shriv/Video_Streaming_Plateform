import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiPlay, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { videoService, formatViews, formatTimeAgo, formatDuration } from '../../services/api';
import VideoCard from '../../components/Video/VideoCard';

import styles from './Home.module.css';

const CATEGORIES = [
  'All',
  'Music',
  'Gaming',
  'Tech',
  'Education',
  'Entertainment',
  'Science',
  'Sports',
];

const LIMIT = 12;

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [videos, setVideos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Build query string from active category
  const buildQuery = useCallback(() => {
    if (searchQuery) return searchQuery;
    if (activeCategory && activeCategory !== 'All') return activeCategory;
    return '';
  }, [searchQuery, activeCategory]);

  // Fetch videos
  const fetchVideos = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const query = buildQuery();
        const params = {
          page: pageNum,
          limit: LIMIT,
          sortBy: 'createdAt',
          sortType: 'desc',
        };
        if (query) params.query = query;

        const res = await videoService.getAll(params);
        const data = res.data?.data;

        // Handle different response shapes
        const fetched = Array.isArray(data)
          ? data
          : data?.docs || data?.videos || [];

        const total = data?.totalDocs || data?.total || 0;

        if (append) {
          setVideos((prev) => [...prev, ...fetched]);
        } else {
          setVideos(fetched);
        }

        setHasMore(pageNum * LIMIT < total || fetched.length === LIMIT);
      } catch (err) {
        console.error('Failed to fetch videos:', err);
        toast.error('Failed to load videos');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery]
  );

  // Re-fetch when search query or category changes
  useEffect(() => {
    setPage(1);
    fetchVideos(1, false);
  }, [fetchVideos]);

  // Handle category click
  const handleCategoryClick = (category) => {
    if (category === activeCategory) return;
    setActiveCategory(category);
    setPage(1);
  };

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(nextPage, true);
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName?.split(' ')[0] || user?.username || 'there';

  // Skeleton cards while loading
  const renderSkeletons = () => (
    <div className={styles.skeletonGrid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} style={{ animationDelay: `${i * 0.05}s` }}>
          <div className={styles.skeletonThumb} />
          <div className={styles.skeletonInfo}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonText}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonMeta} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.home}>
      {/* ── Welcome / Search Header ── */}
      {searchQuery ? (
        <div className={styles.welcomeSection}>
          <h2 className={styles.searchHeading}>
            <FiSearch style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Results for "<span className={styles.searchQuery}>{searchQuery}</span>"
          </h2>
          <p className={styles.searchMeta}>
            {loading ? 'Searching...' : `${videos.length} video${videos.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      ) : (
        <div className={styles.welcomeSection}>
          <h1 className={styles.greeting}>
            {getGreeting()}, <span className={styles.greetingAccent}>{firstName}</span>!
          </h1>
          <p className={styles.subtitle}>Discover something new today</p>
        </div>
      )}

      {/* ── Category Chips ── */}
      <div className={styles.chipsContainer}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Video Grid ── */}
      <div className={styles.gridSection}>
        {loading ? (
          renderSkeletons()
        ) : videos.length === 0 ? (
          <div className={styles.emptyState}>
            <FiPlay className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No videos found</h3>
            <p className={styles.emptySubtitle}>
              {searchQuery
                ? `We couldn't find any videos matching "${searchQuery}". Try a different search.`
                : 'Be the first to upload a video!'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.videoGrid}>
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>

            {/* ── Load More ── */}
            {hasMore && (
              <div className={styles.loadMoreContainer}>
                <button
                  className={styles.loadMoreBtn}
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

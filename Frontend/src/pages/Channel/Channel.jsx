import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiEdit2,
  FiUploadCloud,
  FiFilm,
  FiList,
  FiInfo,
  FiCalendar,
  FiBell,
  FiBellOff,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  userService,
  videoService,
  playlistService,
  subscriptionService,
  formatViews,
  formatTimeAgo,
} from '../../services/api';
import VideoGrid from '../../components/Video/VideoGrid';
import Avatar from '../../components/Common/Avatar';
import toast from 'react-hot-toast';
import styles from './Channel.module.css';

const TABS = ['Videos', 'Playlists', 'About'];

export default function Channel() {
  const { username } = useParams();
  const { user } = useAuth();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Videos');

  // Tab data
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  const isOwnChannel = user && channel && user._id === channel._id;

  // ── Fetch channel ──
  const fetchChannel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getChannel(username);
      const data = res.data.data;
      setChannel(data);
      setIsSubscribed(data.isSubscribed || false);
      setSubscriberCount(data.subscribersCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load channel');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchChannel();
    setActiveTab('Videos');
  }, [fetchChannel]);

  // ── Fetch videos ──
  useEffect(() => {
    if (!channel || activeTab !== 'Videos') return;
    const fetchVideos = async () => {
      setVideosLoading(true);
      try {
        const res = await videoService.getAll({ userId: channel._id });
        setVideos(res.data.data?.docs || res.data.data || []);
      } catch {
        setVideos([]);
      } finally {
        setVideosLoading(false);
      }
    };
    fetchVideos();
  }, [channel, activeTab]);

  // ── Fetch playlists ──
  useEffect(() => {
    if (!channel || activeTab !== 'Playlists') return;
    const fetchPlaylists = async () => {
      setPlaylistsLoading(true);
      try {
        const res = await playlistService.getUserPlaylists(channel._id);
        setPlaylists(res.data.data || []);
      } catch {
        setPlaylists([]);
      } finally {
        setPlaylistsLoading(false);
      }
    };
    fetchPlaylists();
  }, [channel, activeTab]);

  // ── Toggle subscribe ──
  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }
    setSubLoading(true);
    try {
      await subscriptionService.toggle(channel._id);
      setIsSubscribed((prev) => !prev);
      setSubscriberCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
      toast.success(isSubscribed ? 'Unsubscribed' : 'Subscribed!');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubLoading(false);
    }
  };

  // ── Render states ──
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} onClick={fetchChannel}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!channel) return null;

  const joinedDate = channel.createdAt
    ? new Date(channel.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className={styles.page}>
      {/* Cover Banner */}
      <div className={styles.banner}>
        {channel.coverImage ? (
          <img src={channel.coverImage} alt="Channel cover" className={styles.coverImage} />
        ) : (
          <div className={styles.coverFallback} />
        )}
        <div className={styles.bannerOverlay} />
      </div>

      {/* Channel Header */}
      <div className={styles.channelHeader}>
        <div className={styles.avatarWrapper}>
          <Avatar
            src={channel.avatar}
            alt={channel.fullname}
            size={80}
            className={styles.avatar}
          />
        </div>

        <div className={styles.channelInfo}>
          <h1 className={styles.channelName}>{channel.fullname}</h1>
          <p className={styles.channelUsername}>@{channel.username}</p>
          <div className={styles.channelStats}>
            <span className={styles.stat}>
              <strong>{formatViews(subscriberCount)}</strong> subscribers
            </span>
            <span className={styles.stat}>
              <strong>{channel.channelsSubscribedToCount ?? channel.videoCount ?? 0}</strong> videos
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          {isOwnChannel ? (
            <>
              <Link to="/settings" className={styles.editBtn}>
                <FiEdit2 /> Edit Channel
              </Link>
              <Link to="/upload" className={styles.uploadBtn}>
                <FiUploadCloud /> Upload
              </Link>
            </>
          ) : (
            <button
              className={isSubscribed ? styles.subscribedBtn : styles.subscribeBtn}
              onClick={handleSubscribe}
              disabled={subLoading}
            >
              {isSubscribed ? <><FiBellOff /> Subscribed</> : <><FiBell /> Subscribe</>}
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent} key={activeTab}>
        {activeTab === 'Videos' && (
          <>
            {videosLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
              </div>
            ) : videos.length > 0 ? (
              <VideoGrid videos={videos} />
            ) : (
              <div className={styles.emptyState}>
                <FiFilm className={styles.emptyIcon} />
                <p className={styles.emptyText}>No videos yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'Playlists' && (
          <>
            {playlistsLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
              </div>
            ) : playlists.length > 0 ? (
              <div className={styles.playlistGrid}>
                {playlists.map((pl) => (
                  <Link
                    key={pl._id}
                    to={`/playlist/${pl._id}`}
                    className={styles.playlistCard}
                  >
                    {pl.videos?.[0]?.thumbnail ? (
                      <div className={styles.playlistThumbnail}>
                        <img src={pl.videos[0].thumbnail} alt={pl.name} />
                      </div>
                    ) : (
                      <div className={styles.playlistPlaceholder}>
                        <FiList />
                      </div>
                    )}
                    <div className={styles.playlistInfo}>
                      <h3 className={styles.playlistName}>{pl.name}</h3>
                      <span className={styles.playlistCount}>
                        {pl.videos?.length || 0} video{(pl.videos?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FiList className={styles.emptyIcon} />
                <p className={styles.emptyText}>No playlists yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'About' && (
          <div className={styles.aboutContent}>
            <div className={styles.aboutSection}>
              <p className={styles.aboutLabel}>Description</p>
              <p className={styles.aboutText}>
                {channel.description || channel.bio || 'No description provided.'}
              </p>
            </div>
            {joinedDate && (
              <div className={styles.aboutSection}>
                <p className={styles.aboutLabel}>Joined</p>
                <p className={styles.aboutText}>
                  <FiCalendar style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                  {joinedDate}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

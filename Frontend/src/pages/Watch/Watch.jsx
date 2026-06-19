import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiThumbsUp,
  FiShare2,
  FiBookmark,
  FiMessageCircle,
  FiTrash2,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import {
  videoService,
  commentService,
  likeService,
  subscriptionService,
  formatViews,
  formatTimeAgo,
  formatDuration,
} from '../../services/api';

import styles from './Watch.module.css';

export default function Watch() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  // ── State ──
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  // UI state
  const [descExpanded, setDescExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentFocused, setCommentFocused] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // ── Fetch video data ──
  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await videoService.getById(videoId);
      const data = res.data?.data;

      setVideo(data);
      setIsLiked(data.isLiked || false);
      setLikesCount(data.likesCount || data.likes || 0);
      setIsSubscribed(data.isSubscribed || false);
      setSubscriberCount(data.subscribersCount || data.owner?.subscribersCount || 0);
    } catch (err) {
      console.error('Failed to fetch video:', err);
      setError('Video not found or unavailable');
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  // ── Fetch comments ──
  const fetchComments = useCallback(async () => {
    try {
      const res = await commentService.getComments(videoId);
      const data = res.data?.data;
      const fetched = Array.isArray(data) ? data : data?.docs || data?.comments || [];
      setComments(fetched);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  }, [videoId]);

  // ── Fetch recommendations ──
  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await videoService.getAll({ limit: 8 });
      const data = res.data?.data;
      const fetched = Array.isArray(data) ? data : data?.docs || data?.videos || [];
      // Exclude current video
      setRecommendations(fetched.filter((v) => v._id !== videoId));
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  }, [videoId]);

  // ── Effects ──
  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchComments();
      fetchRecommendations();
      // Scroll to top when videoId changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [videoId, fetchVideo, fetchComments, fetchRecommendations]);

  // ── Like Toggle ──
  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like videos');
      return;
    }
    // Optimistic update
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      await likeService.toggleVideoLike(videoId);
    } catch (err) {
      // Revert on failure
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
      toast.error('Failed to update like');
    }
  };

  // ── Share ──
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // ── Save (Placeholder) ──
  const handleSave = () => {
    toast('Save to playlist coming soon!', { icon: '📁' });
  };

  // ── Subscribe Toggle ──
  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please login to subscribe');
      return;
    }
    if (!video?.owner?._id) return;

    // Optimistic update
    setIsSubscribed((prev) => !prev);
    setSubscriberCount((prev) => (isSubscribed ? prev - 1 : prev + 1));

    try {
      await subscriptionService.toggle(video.owner._id);
    } catch (err) {
      // Revert
      setIsSubscribed((prev) => !prev);
      setSubscriberCount((prev) => (isSubscribed ? prev + 1 : prev - 1));
      toast.error('Failed to update subscription');
    }
  };

  // ── Add Comment ──
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const res = await commentService.addComment(videoId, commentText.trim());
      const newComment = res.data?.data;

      // Prepend new comment with user info
      const enriched = {
        ...newComment,
        owner: newComment?.owner || {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
        },
      };
      setComments((prev) => [enriched, ...prev]);
      setCommentText('');
      setCommentFocused(false);
      toast.success('Comment added!');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── Delete Comment ──
  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  // ── Formatted date ──
  const formattedDate = video?.createdAt
    ? new Date(video.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  if (loading) {
    return (
      <div className={styles.watch}>
        <div className={styles.loadingPage}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className={styles.watch}>
        <div className={styles.errorState}>
          <FiAlertCircle className={styles.errorIcon} />
          <h3 className={styles.errorTitle}>{error || 'Video not found'}</h3>
          <p className={styles.errorSubtitle}>
            The video you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const ownerUsername = video.owner?.username || '';
  const ownerAvatar = video.owner?.avatar || '';
  const ownerName = video.owner?.fullName || video.owner?.username || 'Unknown';
  const isOwnChannel = user?._id === video.owner?._id;

  return (
    <div className={styles.watch}>
      {/* ════════════════════════════════════
           MAIN CONTENT
           ════════════════════════════════════ */}
      <div className={styles.mainContent}>
        {/* ── Video Player ── */}
        <div className={styles.playerContainer}>
          <video
            className={styles.videoPlayer}
            src={video.videoFile}
            controls
            autoPlay
            poster={video.thumbnail}
          />
        </div>

        {/* ── Video Info ── */}
        <div className={styles.videoInfo}>
          <h1 className={styles.videoTitle}>{video.title}</h1>
          <div className={styles.videoMeta}>
            <span>{formatViews(video.views)} views</span>
            <span className={styles.metaDot} />
            <span>{formatTimeAgo(video.createdAt)}</span>
            {formattedDate && (
              <>
                <span className={styles.metaDot} />
                <span>{formattedDate}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className={styles.actionsRow}>
          <button
            className={`${styles.actionBtn} ${isLiked ? styles.actionBtnLiked : ''}`}
            onClick={handleLike}
            title="Like"
          >
            <FiThumbsUp style={isLiked ? { fill: 'currentColor' } : {}} />
            {likesCount > 0 && <span>{formatViews(likesCount)}</span>}
          </button>

          <button className={styles.actionBtn} onClick={handleShare} title="Share">
            <FiShare2 />
            <span>Share</span>
          </button>

          <button className={styles.actionBtn} onClick={handleSave} title="Save">
            <FiBookmark />
            <span>Save</span>
          </button>
        </div>

        {/* ── Channel Bar ── */}
        <div className={styles.channelBar}>
          <div className={styles.channelLeft}>
            <Link to={`/channel/${ownerUsername}`}>
              <img
                className={styles.channelAvatar}
                src={ownerAvatar}
                alt={ownerName}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=252525&color=fff&size=44`;
                }}
              />
            </Link>
            <div className={styles.channelInfo}>
              <Link to={`/channel/${ownerUsername}`} className={styles.channelName}>
                {ownerName}
              </Link>
              <span className={styles.channelSubs}>
                {formatViews(subscriberCount)} subscribers
              </span>
            </div>
          </div>

          {!isOwnChannel && (
            <button
              className={`${styles.subscribeBtn} ${
                isSubscribed ? styles.subscribeBtnSubscribed : styles.subscribeBtnActive
              }`}
              onClick={handleSubscribe}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        {/* ── Description ── */}
        {video.description && (
          <div
            className={styles.description}
            onClick={() => !descExpanded && setDescExpanded(true)}
            role={!descExpanded ? 'button' : undefined}
            tabIndex={!descExpanded ? 0 : undefined}
          >
            <div className={styles.descriptionMeta}>
              <span>{formatViews(video.views)} views</span>
              <span>{formatTimeAgo(video.createdAt)}</span>
            </div>
            <p
              className={`${styles.descriptionText} ${
                !descExpanded ? styles.descriptionCollapsed : ''
              }`}
            >
              {video.description}
            </p>
            <button
              className={styles.showMoreBtn}
              onClick={(e) => {
                e.stopPropagation();
                setDescExpanded((prev) => !prev);
              }}
            >
              {descExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}

        {/* ── Comments Section ── */}
        <div className={styles.commentsSection}>
          <h3 className={styles.commentsHeader}>
            Comments
            <span className={styles.commentCount}>{comments.length}</span>
          </h3>

          {/* Add Comment */}
          {user && (
            <form className={styles.commentInput} onSubmit={handleAddComment}>
              <img
                className={styles.commentInputAvatar}
                src={user.avatar}
                alt={user.username}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=252525&color=fff&size=40`;
                }}
              />
              <div className={styles.commentInputWrapper}>
                <textarea
                  ref={textareaRef}
                  className={styles.commentTextarea}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onFocus={() => setCommentFocused(true)}
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
                {commentFocused && (
                  <div className={styles.commentActions}>
                    <button
                      type="button"
                      className={styles.commentCancelBtn}
                      onClick={() => {
                        setCommentText('');
                        setCommentFocused(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.commentSubmitBtn}
                      disabled={!commentText.trim() || submittingComment}
                    >
                      {submittingComment ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Comment List */}
          <div className={styles.commentList}>
            {comments.map((comment) => {
              const cOwner = comment.owner || {};
              const isOwner = user?._id === cOwner._id;

              return (
                <div key={comment._id} className={styles.commentItem}>
                  <Link to={`/channel/${cOwner.username || ''}`}>
                    <img
                      className={styles.commentAvatar}
                      src={cOwner.avatar || ''}
                      alt={cOwner.username || 'user'}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cOwner.fullName || cOwner.username || 'U')}&background=252525&color=fff&size=40`;
                      }}
                    />
                  </Link>
                  <div className={styles.commentContent}>
                    <div className={styles.commentAuthor}>
                      <span className={styles.commentAuthorName}>
                        @{cOwner.username || 'user'}
                      </span>
                      <span className={styles.commentTime}>
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className={styles.commentText}>{comment.content}</p>
                    <div className={styles.commentItemActions}>
                      <button className={styles.commentLikeBtn} title="Like comment">
                        <FiThumbsUp size={14} />
                        {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
                      </button>
                      {isOwner && (
                        <button
                          className={styles.commentDeleteBtn}
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Delete comment"
                        >
                          <FiTrash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {comments.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                <FiMessageCircle size={28} style={{ marginBottom: 8, opacity: 0.5, display: 'block', margin: '0 auto 8px' }} />
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
           SIDEBAR
           ════════════════════════════════════ */}
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Up Next</h3>
        <div className={styles.recList}>
          {recommendations.map((rec) => (
            <Link
              key={rec._id}
              to={`/watch/${rec._id}`}
              className={styles.recCard}
            >
              <div className={styles.recThumbWrapper}>
                <img
                  className={styles.recThumb}
                  src={rec.thumbnail}
                  alt={rec.title}
                  loading="lazy"
                />
                {rec.duration != null && (
                  <span className={styles.recDuration}>
                    {formatDuration(rec.duration)}
                  </span>
                )}
              </div>
              <div className={styles.recInfo}>
                <span className={styles.recTitle}>{rec.title}</span>
                <span className={styles.recChannel}>
                  {rec.owner?.fullName || rec.owner?.username || 'Unknown'}
                </span>
                <span className={styles.recMeta}>
                  {formatViews(rec.views)} views
                  <span className={styles.recMetaDot} />
                  {formatTimeAgo(rec.createdAt)}
                </span>
              </div>
            </Link>
          ))}

          {recommendations.length === 0 && !loading && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              No recommendations available
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

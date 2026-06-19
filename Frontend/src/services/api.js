import axios from 'axios';

const API = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for automatic token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => API(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post('/api/v1/user/refresh-token', {}, { withCredentials: true });
        processQueue(null);
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('viewtube_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════
export const authService = {
  register: (formData) =>
    API.post('/user/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  login: (credentials) => API.post('/user/login', credentials),

  logout: () => API.post('/user/logout'),

  refreshToken: () => API.post('/user/refresh-token'),

  getCurrentUser: () => API.get('/user/current-user'),
};

// ═══════════════════════════════════════════
// VIDEO SERVICE
// ═══════════════════════════════════════════
export const videoService = {
  getAll: (params = {}) => API.get('/videos', { params }),

  getById: (videoId) => API.get(`/videos/${videoId}`),

  upload: (formData, onUploadProgress) =>
    API.post('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),

  update: (videoId, data) =>
    API.patch(`/videos/${videoId}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  delete: (videoId) => API.delete(`/videos/${videoId}`),

  togglePublish: (videoId) => API.patch(`/videos/toggle/publish/${videoId}`),
};

// ═══════════════════════════════════════════
// COMMENT SERVICE
// ═══════════════════════════════════════════
export const commentService = {
  getComments: (videoId, params = {}) => API.get(`/comments/${videoId}`, { params }),

  addComment: (videoId, content) => API.post(`/comments/${videoId}`, { content }),

  updateComment: (commentId, content) => API.patch(`/comments/c/${commentId}`, { content }),

  deleteComment: (commentId) => API.delete(`/comments/c/${commentId}`),
};

// ═══════════════════════════════════════════
// LIKE SERVICE
// ═══════════════════════════════════════════
export const likeService = {
  toggleVideoLike: (videoId) => API.post(`/likes/toggle/v/${videoId}`),

  toggleCommentLike: (commentId) => API.post(`/likes/toggle/c/${commentId}`),

  getLikedVideos: (params = {}) => API.get('/likes/videos', { params }),
};

// ═══════════════════════════════════════════
// SUBSCRIPTION SERVICE
// ═══════════════════════════════════════════
export const subscriptionService = {
  toggle: (channelId) => API.post(`/subscriptions/c/${channelId}`),

  getSubscribers: (channelId) => API.get(`/subscriptions/c/${channelId}`),

  getSubscriptions: (subscriberId) => API.get(`/subscriptions/u/${subscriberId}`),
};

// ═══════════════════════════════════════════
// PLAYLIST SERVICE
// ═══════════════════════════════════════════
export const playlistService = {
  create: (data) => API.post('/playlists', data),

  getUserPlaylists: (userId) => API.get(`/playlists/user/${userId}`),

  getById: (playlistId) => API.get(`/playlists/${playlistId}`),

  update: (playlistId, data) => API.patch(`/playlists/${playlistId}`, data),

  delete: (playlistId) => API.delete(`/playlists/${playlistId}`),

  addVideo: (videoId, playlistId) => API.patch(`/playlists/add/${videoId}/${playlistId}`),

  removeVideo: (videoId, playlistId) => API.patch(`/playlists/remove/${videoId}/${playlistId}`),
};

// ═══════════════════════════════════════════
// USER SERVICE
// ═══════════════════════════════════════════
export const userService = {
  getChannel: (username) => API.get(`/user/channel/${username}`),

  updateAccount: (data) => API.patch('/user/update-account', data),

  updateAvatar: (formData) =>
    API.post('/user/update-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCover: (formData) =>
    API.post('/user/update-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (data) => API.post('/user/change-password', data),

  getWatchHistory: () => API.get('/user/history'),

  clearWatchHistory: () => API.delete('/user/history'),

  getNotifications: () => API.get('/user/notifications'),

  markNotificationsRead: () => API.patch('/user/notifications/read'),
};

// ═══════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════
export const formatViews = (count) => {
  if (!count) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default API;

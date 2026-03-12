// MayankTube - YouTube-like Video Streaming Platform
'use strict';

// ==================== CONFIGURATION ====================
const CONFIG = {
    API_BASE_URL: '/api',
    TOAST_DURATION: 3000,
    SEARCH_DEBOUNCE_MS: 300,
    MIN_SEARCH_LENGTH: 2,
    SKELETON_COUNT: 8,
    RELATED_VIDEOS_LIMIT: 10,
    VIDEO_SKIP_SECONDS: 5,
    THUMBNAIL_SEEK_TIME: 2,
};

// Time constants in seconds
const TIME = {
    MINUTE: 60,
    HOUR: 3600,
    DAY: 86400,
    MONTH: 2592000,
    YEAR: 31536000,
};

// ==================== STATE ====================
const State = {
    videos: [],
    currentVideoId: null,
    user: null,
    accessToken: null,
    refreshToken: null,
    fpEmail: null,       // forgot password email (temp state)
    resetToken: null,    // reset token from OTP verification

    init() {
        try {
            this.user = JSON.parse(localStorage.getItem('user')) || null;
            this.accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token') || null;
            this.refreshToken = localStorage.getItem('refreshToken') || null;
        } catch {
            this.clearAuth();
        }
    },

    setAuth(user, accessToken, refreshToken) {
        this.user = user;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        // Remove legacy key
        localStorage.removeItem('token');
    },

    clearAuth() {
        this.user = null;
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
    },

    get isAuthenticated() {
        return !!(this.user && this.accessToken);
    },

    // Alias for backward compat
    get token() {
        return this.accessToken;
    }
};

// ==================== DOM UTILITIES ====================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// Debounce utility for search
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// ==================== TOAST NOTIFICATIONS ====================
const Toast = {
    show(message, duration = CONFIG.TOAST_DURATION) {
        const container = $('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1DB954"/>
            </svg>
            <span>${Utils.escapeHtml(message)}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    error(message) {
        this.show(message, CONFIG.TOAST_DURATION);
    }
};

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatViews(views) {
        const count = views || 0;
        if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + 'M views';
        if (count >= 1_000) return (count / 1_000).toFixed(1) + 'K views';
        return count + ' views';
    },

    formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        const hours = Math.floor(seconds / TIME.HOUR);
        const mins = Math.floor((seconds % TIME.HOUR) / TIME.MINUTE);
        const secs = Math.floor(seconds % TIME.MINUTE);

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    getTimeAgo(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const diff = Math.floor((Date.now() - date.getTime()) / 1000);

        if (diff < TIME.MINUTE) return 'just now';
        if (diff < TIME.HOUR) {
            const mins = Math.floor(diff / TIME.MINUTE);
            return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
        }
        if (diff < TIME.DAY) {
            const hours = Math.floor(diff / TIME.HOUR);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
        if (diff < TIME.MONTH) {
            const days = Math.floor(diff / TIME.DAY);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }
        if (diff < TIME.YEAR) {
            const months = Math.floor(diff / TIME.MONTH);
            return `${months} ${months === 1 ? 'month' : 'months'} ago`;
        }
        const years = Math.floor(diff / TIME.YEAR);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
};

// ==================== AUTHENTICATION ====================
function updateAuthUI() {
    const loginBtn = $('loginBtn');
    const userInfo = $('userInfo');
    const userAvatar = $('userAvatar');

    if (State.isAuthenticated) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userAvatar) {
            userAvatar.textContent = State.user.username.charAt(0).toUpperCase();
            userAvatar.title = State.user.username;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        State.clearAuth();
    }
}

// Auth Modal
const authModal = $('authModal');
const loginBtn = $('loginBtn');
const closeModal = document.querySelector('.close');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (authModal) authModal.classList.add('active');
        showLoginForm();
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (authModal) authModal.classList.remove('active');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.classList.remove('active');
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal?.classList.contains('active')) {
        authModal.classList.remove('active');
    }
});

function showLoginForm() {
    const login = $('loginFormContainer');
    const signup = $('signupFormContainer');
    if (login) login.style.display = 'block';
    if (signup) signup.style.display = 'none';
}

function showSignupForm() {
    const login = $('loginFormContainer');
    const signup = $('signupFormContainer');
    if (login) login.style.display = 'none';
    if (signup) signup.style.display = 'block';
}

const toSignup = $('toSignup');
const toLogin = $('toLogin');
if (toSignup) toSignup.addEventListener('click', (e) => { e.preventDefault(); showSignupForm(); });
if (toLogin) toLogin.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });

// Login Form
const loginForm = $('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('loginEmail').value.trim();
        const password = $('loginPassword').value;

        if (!email || !password) {
            Toast.show('Please fill in all fields');
            return;
        }

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                State.setAuth(data.user, data.accessToken, data.refreshToken);
                updateAuthUI();
                authModal.classList.remove('active');
                loginForm.reset();
                Toast.show(`Welcome back, ${State.user.username}!`);
            } else {
                Toast.show(data.error || 'Login failed');
            }
        } catch (err) {
            Toast.error('Connection error');
        }
    });
}

// Signup Form
const signupForm = $('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('signupUsername').value.trim();
        const email = $('signupEmail').value.trim();
        const password = $('signupPassword').value;

        if (!username || !email || !password) {
            Toast.show('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Toast.show('Password must be at least 6 characters');
            return;
        }

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                State.setAuth(data.user, data.accessToken, data.refreshToken);
                updateAuthUI();
                authModal.classList.remove('active');
                signupForm.reset();
                Toast.show(`Welcome, ${State.user.username}!`);
            } else {
                Toast.show(data.error || 'Signup failed');
            }
        } catch (err) {
            Toast.error('Connection error');
        }
    });
}

// Logout
const logoutBtn = $('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        // Call logout API to invalidate refresh token
        try {
            if (State.accessToken) {
                await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${State.accessToken}` }
                });
            }
        } catch (e) { /* ignore */ }
        State.clearAuth();
        updateAuthUI();
        showView('home');
        Toast.show('Signed out');
    });
}

// ==================== NAVIGATION ====================
const menuBtn = $('menuBtn');
const sidebar = $('sidebar');

if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar?.classList.contains('open') &&
        !sidebar.contains(e.target) && !menuBtn?.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

$$('.nav-icon[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        $$('.nav-icon').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        showView(view);
        if (window.innerWidth <= 768) sidebar?.classList.remove('open');
    });
});

const uploadHeaderBtn = $('uploadHeaderBtn');
if (uploadHeaderBtn) {
    uploadHeaderBtn.addEventListener('click', () => {
        if (!State.isAuthenticated) {
            Toast.show('Please sign in to upload');
            authModal?.classList.add('active');
            return;
        }
        $$('.nav-icon').forEach(n => n.classList.remove('active'));
        $('uploadNavBtn')?.classList.add('active');
        showView('upload');
    });
}

// ==================== CATEGORY CHIPS ====================
$$('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        $$('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const category = chip.getAttribute('data-category');
        filterByCategory(category);
    });
});

function filterByCategory(category) {
    if (category === 'all') {
        displayVideos(State.videos);
    } else {
        const filtered = State.videos.filter(v =>
            (v.title + ' ' + (v.description || '')).toLowerCase().includes(category)
        );
        displayVideos(filtered);
    }
}

// ==================== SEARCH ====================
const searchForm = $('searchForm');
const searchInput = $('searchInput');

if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput?.value.trim().toLowerCase();
        if (query) {
            filterVideos(query);
            // Show results in search view
            const searchResults = $('searchResults');
            if (searchResults) {
                const filtered = State.videos.filter(v =>
                    v.title.toLowerCase().includes(query) ||
                    (v.description && v.description.toLowerCase().includes(query))
                );
                displayVideosInContainer(filtered, searchResults);
            }
        }
    });
}

// Debounced search for better performance
const debouncedSearch = debounce((query) => {
    if (query.length >= CONFIG.MIN_SEARCH_LENGTH) {
        filterVideos(query);
    } else if (query.length === 0) {
        displayVideos(State.videos);
    }
}, CONFIG.SEARCH_DEBOUNCE_MS);

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        debouncedSearch(query);
    });
}

// Mobile search
const mobileSearchBtn = $('mobileSearchBtn');
const mobileSearchOverlay = $('mobileSearchOverlay');
const mobileSearchBack = $('mobileSearchBack');
const mobileSearchInput = $('mobileSearchInput');
const mobileSearchForm = $('mobileSearchForm');

if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener('click', () => {
        mobileSearchOverlay?.classList.add('active');
        setTimeout(() => mobileSearchInput?.focus(), 200);
    });
}

if (mobileSearchBack) {
    mobileSearchBack.addEventListener('click', () => {
        mobileSearchOverlay?.classList.remove('active');
        if (mobileSearchInput) mobileSearchInput.value = '';
    });
}

if (mobileSearchForm) {
    mobileSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = mobileSearchInput?.value.trim().toLowerCase();
        if (query) {
            filterVideos(query);
            mobileSearchOverlay?.classList.remove('active');
            showView('home');
        }
    });
}

function filterVideos(query) {
    const filtered = State.videos.filter(v =>
        v.title.toLowerCase().includes(query) ||
        (v.description && v.description.toLowerCase().includes(query))
    );
    displayVideos(filtered);
}

// ==================== VIEW MANAGEMENT ====================
function showView(viewName) {
    const homeView = $('homeView');
    const uploadView = $('uploadView');
    const playerView = $('playerView');
    const searchView = $('searchView');
    const profileView = $('profileView');

    homeView?.classList.remove('active');
    uploadView?.classList.remove('active');
    playerView?.classList.remove('active');
    searchView?.classList.remove('active');
    profileView?.classList.remove('active');

    if (['home', 'trending', 'library', 'history', 'watchlater'].includes(viewName)) {
        homeView?.classList.add('active');
        loadVideos(viewName === 'trending' ? 'trending' : '');
    } else if (viewName === 'search') {
        searchView?.classList.add('active');
    } else if (viewName === 'upload') {
        uploadView?.classList.add('active');
    } else if (viewName === 'player') {
        playerView?.classList.add('active');
    } else if (viewName === 'profile') {
        if (!State.isAuthenticated) {
            Toast.show('Please sign in to view your profile');
            authModal?.classList.add('active');
            return;
        }
        profileView?.classList.add('active');
        loadProfile();
    }
}

// ==================== VIDEO LOADING ====================
async function loadVideos(sort = '') {
    const videoGrid = $('videoGrid');
    if (!videoGrid) return;

    videoGrid.innerHTML = createSkeletons(CONFIG.SKELETON_COUNT);

    try {
        const url = sort
            ? `${CONFIG.API_BASE_URL}/videos?sort=${sort}`
            : `${CONFIG.API_BASE_URL}/videos`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('Failed to load videos');

        const data = await res.json();
        State.videos = data.videos || data;

        if (State.videos.length === 0) {
            // Hide uploads section when no videos
            const uploadsSection = $('uploadsSection');
            if (uploadsSection) uploadsSection.style.display = 'none';
            return;
        }

        // Show uploads section when videos exist
        const uploadsSection = $('uploadsSection');
        if (uploadsSection) uploadsSection.style.display = 'block';

        displayVideos(State.videos);
    } catch (err) {
        console.error('Error loading videos:', err);
        videoGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="80" height="80">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                </svg>
                <h3>Something went wrong</h3>
                <p>We couldn't load the videos. Please check your connection and try again.</p>
                <button class="btn btn-primary" onclick="loadVideos()">Try again</button>
            </div>`;
    }
}

function createSkeletons(count) {
    return Array(count).fill().map(() => `
        <div class="video-card">
            <div class="video-thumbnail skeleton" style="aspect-ratio: 16/9;"></div>
            <div class="video-card-info">
                <div class="channel-avatar skeleton"></div>
                <div class="video-details" style="flex: 1;">
                    <div class="skeleton" style="height: 18px; width: 90%; margin-bottom: 8px;"></div>
                    <div class="skeleton" style="height: 14px; width: 60%;"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayVideos(videos) {
    const videoGrid = $('videoGrid');
    if (!videoGrid) return;

    if (videos.length === 0) {
        videoGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="80" height="80">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
                <h3>No results found</h3>
                <p>Try different keywords or remove search filters</p>
            </div>`;
        return;
    }

    videoGrid.innerHTML = videos.map(video => {
        const initial = video.title.charAt(0).toUpperCase();
        const views = Utils.formatViews(video.views);
        const time = Utils.getTimeAgo(video.uploadDate);
        const duration = video.duration
            ? Utils.formatDuration(video.duration)
            : '--:--';

        return `
            <div class="video-card" onclick="playVideo('${video._id}')">
                <div class="video-thumbnail" id="thumb-${video._id}">
                    <span>▶</span>
                    <span class="duration-badge">${duration}</span>
                    <div class="play-overlay">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <button class="watch-later-btn" onclick="event.stopPropagation(); toggleWatchLater('${video._id}', '${Utils.escapeHtml(video.title)}')" title="Watch later">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M12 3.67c-4.58 0-8.33 3.75-8.33 8.33s3.75 8.33 8.33 8.33 8.33-3.75 8.33-8.33S16.58 3.67 12 3.67zm3.5 11.83l-4.33-2.67v-5h1.25v4.34l3.75 2.25-.67 1.08z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <div class="video-card-info">
                    <div class="channel-avatar">${initial}</div>
                    <div class="video-details">
                        <h3>${Utils.escapeHtml(video.title)}</h3>
                        <div class="channel-name">MayankTube Creator</div>
                        <div class="video-meta"><span>${views}</span> • <span>${time}</span></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Generate thumbnails for each video
    videos.forEach(video => generateThumbnail(video._id));
}

// ==================== SHORTS ====================
function loadShorts() {
    const shortsGrid = $('shortsGrid');
    if (!shortsGrid) return;

    const shorts = [
        { title: 'Amazing sunset', views: 1200000 },
        { title: 'Quick cooking hack', views: 856000 },
        { title: 'Funny cat video', views: 2100000 },
        { title: 'Life hack', views: 543000 },
        { title: 'Dance trend', views: 3400000 },
    ];

    shortsGrid.innerHTML = shorts.map(s => `
        <div class="short-card">
            <div class="short-thumbnail"><span>▶</span></div>
            <div class="short-title">${Utils.escapeHtml(s.title)}</div>
            <div class="short-views">${Utils.formatViews(s.views)}</div>
        </div>
    `).join('');
}

// ==================== VIDEO PLAYER ====================
async function playVideo(videoId) {
    State.currentVideoId = videoId;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/videos/${videoId}`);
        if (!res.ok) throw new Error('Video not found');

        const video = await res.json();

        const playerTitle = $('playerTitle');
        const playerDescription = $('playerDescription');
        const playerViews = $('playerViews');
        const playerDate = $('playerDate');
        const videoPlayer = $('videoPlayer');

        if (playerTitle) playerTitle.textContent = video.title;
        if (playerDescription) playerDescription.textContent = video.description || 'No description';
        if (playerViews) playerViews.textContent = Utils.formatViews(video.views);
        if (playerDate) playerDate.textContent = Utils.getTimeAgo(video.uploadDate);
        if (videoPlayer) videoPlayer.src = `${CONFIG.API_BASE_URL}/videos/${videoId}/stream`;

        showView('player');
        loadRelatedVideos(videoId);
        setupPlayerActions(video);

    } catch (err) {
        console.error('Error loading video:', err);
        Toast.error('Error loading video');
    }
}

function setupPlayerActions(video) {
    const isOwner = State.user && video.uploader === State.user.id;
    const actionBtns = document.querySelector('.action-buttons');

    // Remove existing delete button
    document.getElementById('deleteVideoBtn')?.remove();

    if (isOwner && actionBtns) {
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'deleteVideoBtn';
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg><span>Delete</span>`;
        actionBtns.appendChild(deleteBtn);

        deleteBtn.onclick = async () => {
            if (confirm('Delete this video?')) {
                try {
                    const res = await fetch(`${CONFIG.API_BASE_URL}/videos/${video._id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${State.token}` }
                    });
                    if (res.ok) {
                        Toast.show('Video deleted');
                        showView('home');
                    } else {
                        Toast.error('Error deleting video');
                    }
                } catch (err) {
                    Toast.error('Error deleting video');
                }
            }
        };
    }

    // Like button
    const likeBtn = $('likeBtn');
    const dislikeBtn = $('dislikeBtn');
    const likeCount = $('likeCount');
    let likeNum = Math.floor(Math.random() * 500) + 10;
    if (likeCount) likeCount.textContent = likeNum;

    if (likeBtn) {
        likeBtn.onclick = () => {
            if (!State.isAuthenticated) {
                Toast.show('Sign in to like videos');
                authModal?.classList.add('active');
                return;
            }
            const isActive = likeBtn.classList.toggle('active');
            if (dislikeBtn) dislikeBtn.classList.remove('active');
            likeBtn.classList.add('animating');
            setTimeout(() => likeBtn.classList.remove('animating'), 400);
            if (isActive) { likeNum++; } else { likeNum--; }
            if (likeCount) likeCount.textContent = likeNum;
            Toast.show(isActive ? 'Liked' : 'Removed like');
        };
    }

    if (dislikeBtn) {
        dislikeBtn.onclick = () => {
            if (!State.isAuthenticated) {
                Toast.show('Sign in to dislike videos');
                authModal?.classList.add('active');
                return;
            }
            const isActive = dislikeBtn.classList.toggle('active');
            if (likeBtn?.classList.contains('active')) {
                likeBtn.classList.remove('active');
                likeNum--;
                if (likeCount) likeCount.textContent = likeNum;
            }
            Toast.show(isActive ? 'Disliked' : 'Removed dislike');
        };
    }

    // Save button
    const saveBtn = $('saveBtn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            if (!State.isAuthenticated) {
                Toast.show('Sign in to save videos');
                authModal?.classList.add('active');
                return;
            }
            saveBtn.classList.toggle('active');
            Toast.show(saveBtn.classList.contains('active') ? 'Saved' : 'Removed');
        };
    }

    // Share button
    const shareBtn = $('shareBtn');
    if (shareBtn) {
        shareBtn.onclick = async () => {
            const shareData = { title: video.title, url: window.location.href };
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    Toast.show('Link copied');
                }
            } catch (err) {
                // User cancelled or error
                if (err.name !== 'AbortError') {
                    Toast.error('Failed to share');
                }
            }
        };
    }

    // Subscribe button
    const subscribeBtn = $('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.onclick = () => {
            if (!State.isAuthenticated) {
                Toast.show('Sign in to subscribe');
                authModal?.classList.add('active');
                return;
            }
            const isSubscribed = subscribeBtn.classList.contains('subscribed');
            subscribeBtn.classList.toggle('subscribed');
            subscribeBtn.classList.toggle('not-subscribed');
            subscribeBtn.textContent = isSubscribed ? 'Subscribe' : 'Subscribed';
            subscribeBtn.classList.add('animate');
            setTimeout(() => subscribeBtn.classList.remove('animate'), 300);
            Toast.show(isSubscribed ? 'Unsubscribed' : 'Subscribed!');
        };
    }

    // Load comments
    loadComments(video);
}

function loadRelatedVideos(excludeId) {
    const relatedVideos = $('relatedVideos');
    if (!relatedVideos) return;

    const related = State.videos
        .filter(v => v._id !== excludeId)
        .slice(0, CONFIG.RELATED_VIDEOS_LIMIT);

    if (related.length === 0) {
        relatedVideos.innerHTML = '<p>No related videos</p>';
        return;
    }

    relatedVideos.innerHTML = related.map(v => `
        <div class="related-video-card" onclick="playVideo('${v._id}')">
            <div class="related-thumbnail"><span>▶</span></div>
            <div class="related-info">
                <h4>${Utils.escapeHtml(v.title)}</h4>
                <div class="related-meta">
                    <div>MayankTube Creator</div>
                    <div>${Utils.formatViews(v.views)} • ${Utils.getTimeAgo(v.uploadDate)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== UPLOAD ====================
const uploadForm = $('uploadForm');
const videoFile = $('videoFile');
const fileLabelText = $('fileLabelText');

if (videoFile) {
    videoFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && fileLabelText) {
            // Show file name and size
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            fileLabelText.textContent = `${file.name} (${sizeMB} MB)`;
        }
    });
}

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!State.isAuthenticated) {
            Toast.show('Please sign in to upload');
            return;
        }

        const title = $('videoTitle')?.value.trim();
        const description = $('videoDescription')?.value.trim();
        const file = videoFile?.files[0];

        if (!title) {
            Toast.show('Please enter a title');
            return;
        }

        if (!file) {
            Toast.show('Please select a video');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('description', description || '');

        const progress = $('uploadProgress');
        const progressFill = $('progressFill');
        const progressText = $('progressText');

        if (progress) progress.style.display = 'block';

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && progressFill && progressText) {
                    const pct = (e.loaded / e.total) * 100;
                    progressFill.style.width = pct + '%';
                    progressText.textContent = `Uploading... ${Math.round(pct)}%`;
                }
            };

            xhr.onload = () => {
                if (xhr.status === 201) {
                    Toast.show('Video uploaded!');
                    uploadForm.reset();
                    if (fileLabelText) fileLabelText.textContent = 'Drag and drop video files';
                    if (progress) progress.style.display = 'none';
                    // Hide thumbnail preview
                    const preview = document.querySelector('.upload-preview');
                    if (preview) preview.classList.remove('visible');
                    showView('home');
                    loadVideos();
                } else {
                    const errorMsg = xhr.responseText ? JSON.parse(xhr.responseText).error : 'Upload failed';
                    Toast.error(errorMsg || 'Upload failed');
                    if (progress) progress.style.display = 'none';
                }
            };

            xhr.onerror = () => {
                Toast.error('Upload error - check your connection');
                if (progress) progress.style.display = 'none';
            };

            xhr.open('POST', `${CONFIG.API_BASE_URL}/upload`);
            xhr.setRequestHeader('Authorization', `Bearer ${State.token}`);
            xhr.send(formData);

        } catch (err) {
            console.error('Upload error:', err);
            Toast.error('Upload error');
            if (progress) progress.style.display = 'none';
        }
    });
}

// ==================== DRAG AND DROP UPLOAD ====================
const fileLabel = document.querySelector('.file-label');
if (fileLabel && videoFile) {
    ['dragenter', 'dragover'].forEach(evt => {
        fileLabel.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileLabel.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        fileLabel.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileLabel.classList.remove('drag-over');
        });
    });

    fileLabel.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('video/')) {
            videoFile.files = files;
            const sizeMB = (files[0].size / (1024 * 1024)).toFixed(1);
            if (fileLabelText) fileLabelText.textContent = `${files[0].name} (${sizeMB} MB)`;
            generateUploadPreview(files[0]);
        } else {
            Toast.show('Please drop a video file');
        }
    });
}

// Upload thumbnail preview on file select
if (videoFile) {
    videoFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            generateUploadPreview(file);
        }
    });
}

function generateUploadPreview(file) {
    let previewContainer = document.querySelector('.upload-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.className = 'upload-preview';
        const uploadContainer = document.querySelector('.upload-container');
        if (uploadContainer) {
            const formGroup = uploadContainer.querySelector('.form-group');
            if (formGroup) formGroup.after(previewContainer);
        }
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
        video.currentTime = Math.min(CONFIG.THUMBNAIL_SEEK_TIME, video.duration / 4);
    };

    video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        previewContainer.innerHTML = `
            <img src="${dataUrl}" alt="Video preview">
            <p>Thumbnail preview</p>
        `;
        previewContainer.classList.add('visible');
        URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
}

// ==================== THUMBNAIL GENERATION ====================
function generateThumbnail(videoId) {
    const container = $(`thumb-${videoId}`);
    if (!container) return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';

    video.onloadeddata = () => {
        video.currentTime = Math.min(CONFIG.THUMBNAIL_SEEK_TIME, video.duration / 4);
    };

    video.onseeked = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

            const img = document.createElement('img');
            img.className = 'thumb-img';
            img.src = dataUrl;
            img.alt = 'Video thumbnail';
            img.loading = 'lazy';
            container.prepend(img);
        } catch (e) {
            // CORS or other error, keep default gradient
        }
    };

    video.onerror = () => { /* keep default gradient */ };
    video.src = `${CONFIG.API_BASE_URL}/videos/${videoId}/stream`;
}

// ==================== WATCH LATER ====================
function toggleWatchLater(videoId, title) {
    let watchLater = JSON.parse(localStorage.getItem('watchLater') || '[]');
    const index = watchLater.findIndex(item => item.id === videoId);

    if (index === -1) {
        watchLater.push({ id: videoId, title, addedAt: Date.now() });
        Toast.show('Saved to Watch later');
    } else {
        watchLater.splice(index, 1);
        Toast.show('Removed from Watch later');
    }

    localStorage.setItem('watchLater', JSON.stringify(watchLater));
}

// ==================== COMMENTS ====================
const MOCK_COMMENTS = [
    { author: 'TechEnthusiast', text: 'Great video! Really enjoyed the content. Keep it up! 🔥', time: '2 hours ago' },
    { author: 'CreativeMinds', text: 'This is exactly what I was looking for. Thanks for sharing!', time: '5 hours ago' },
    { author: 'DigitalNomad', text: 'Amazing quality! Subscribed.', time: '1 day ago' },
    { author: 'CodeMaster', text: 'Wow, the editing is on point. What software do you use?', time: '2 days ago' },
    { author: 'MusicLover', text: 'The background music choice is perfect 🎵', time: '3 days ago' },
];

function loadComments(video) {
    const commentsList = $('commentsList');
    const commentsCount = $('commentsCount');
    const commentInput = $('commentInput');
    const commentActions = $('commentActions');
    const commentCancel = $('commentCancel');
    const commentSubmit = $('commentSubmit');
    const commentUserAvatar = $('commentUserAvatar');

    // Update comment avatar if logged in
    if (commentUserAvatar && State.isAuthenticated) {
        commentUserAvatar.textContent = State.user.username.charAt(0).toUpperCase();
    }

    // Render mock comments
    if (commentsList) {
        commentsList.innerHTML = MOCK_COMMENTS.map(c => renderComment(c)).join('');
    }
    if (commentsCount) commentsCount.textContent = `${MOCK_COMMENTS.length} Comments`;

    // Comment input focus/blur
    if (commentInput) {
        commentInput.addEventListener('focus', () => {
            commentActions?.classList.add('visible');
        });
    }

    if (commentCancel) {
        commentCancel.addEventListener('click', () => {
            if (commentInput) commentInput.value = '';
            commentActions?.classList.remove('visible');
            commentInput?.blur();
        });
    }

    if (commentSubmit) {
        commentSubmit.addEventListener('click', () => {
            if (!State.isAuthenticated) {
                Toast.show('Sign in to comment');
                authModal?.classList.add('active');
                return;
            }
            const text = commentInput?.value.trim();
            if (!text) {
                Toast.show('Please write a comment');
                return;
            }
            const newComment = {
                author: State.user.username,
                text,
                time: 'just now'
            };
            if (commentsList) {
                commentsList.insertAdjacentHTML('afterbegin', renderComment(newComment));
            }
            // Update count
            const currentCount = parseInt(commentsCount?.textContent) || 0;
            if (commentsCount) commentsCount.textContent = `${currentCount + 1} Comments`;
            if (commentInput) commentInput.value = '';
            commentActions?.classList.remove('visible');
            Toast.show('Comment added');
        });
    }
}

function renderComment(comment) {
    const initial = comment.author.charAt(0).toUpperCase();
    return `
        <div class="comment-item">
            <div class="comment-avatar">${initial}</div>
            <div class="comment-content">
                <div>
                    <span class="comment-author">${Utils.escapeHtml(comment.author)}</span>
                    <span class="comment-date">${comment.time}</span>
                </div>
                <p class="comment-text">${Utils.escapeHtml(comment.text)}</p>
                <div style="display: flex; gap: 8px;">
                    <button class="comment-action-btn">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z" fill="currentColor"/></svg>
                    </button>
                    <button class="comment-action-btn">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z" fill="currentColor" transform="rotate(180 12 12)"/></svg>
                    </button>
                    <button class="comment-action-btn">Reply</button>
                </div>
            </div>
        </div>
    `;
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    // Skip if typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const videoPlayer = $('videoPlayer');
    const playerView = $('playerView');

    // Video player shortcuts
    if (playerView?.classList.contains('active') && videoPlayer) {
        const key = e.key;

        switch (key) {
            case ' ':
            case 'k':
            case 'K':
                e.preventDefault();
                videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                document.fullscreenElement ? document.exitFullscreen() : videoPlayer.requestFullscreen();
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                videoPlayer.muted = !videoPlayer.muted;
                Toast.show(videoPlayer.muted ? 'Muted' : 'Unmuted');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                videoPlayer.currentTime -= CONFIG.VIDEO_SKIP_SECONDS;
                break;
            case 'ArrowRight':
                e.preventDefault();
                videoPlayer.currentTime += CONFIG.VIDEO_SKIP_SECONDS;
                break;
            case 'ArrowUp':
                e.preventDefault();
                videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
                break;
            case 'j':
            case 'J':
                e.preventDefault();
                videoPlayer.currentTime -= 10;
                break;
            case 'l':
            case 'L':
                e.preventDefault();
                videoPlayer.currentTime += 10;
                break;
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                videoPlayer.currentTime = (parseInt(key) / 10) * videoPlayer.duration;
                break;
        }
    }

    // Global shortcuts
    if (e.key === '/') {
        e.preventDefault();
        searchInput?.focus();
    }
});

// ==================== HELPER: Render videos in any container ====================
function displayVideosInContainer(videos, container) {
    if (!container) return;
    if (videos.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:#888;padding:40px;"><p>No results found</p></div>`;
        return;
    }
    container.innerHTML = videos.map(video => {
        const initial = video.title.charAt(0).toUpperCase();
        const views = Utils.formatViews(video.views);
        const time = Utils.getTimeAgo(video.uploadDate);
        const duration = video.duration ? Utils.formatDuration(video.duration) : '--:--';
        return `
            <div class="video-card" onclick="playVideo('${video._id}')">
                <div class="video-thumbnail" id="search-thumb-${video._id}">
                    <span>▶</span>
                    <span class="duration-badge">${duration}</span>
                    <div class="play-overlay">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                </div>
                <div class="video-card-info">
                    <div class="channel-avatar">${initial}</div>
                    <div class="video-details">
                        <h3>${Utils.escapeHtml(video.title)}</h3>
                        <div class="channel-name">MayankTube Creator</div>
                        <div class="video-meta"><span>${views}</span> • <span>${time}</span></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== AUTH FETCH WITH AUTO-REFRESH ====================
async function authFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (State.accessToken) {
        options.headers['Authorization'] = `Bearer ${State.accessToken}`;
    }

    let res = await fetch(url, options);

    // If 401 with TOKEN_EXPIRED, try refresh
    if (res.status === 401 && State.refreshToken) {
        const data = await res.json().catch(() => ({}));
        if (data.code === 'TOKEN_EXPIRED') {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                options.headers['Authorization'] = `Bearer ${State.accessToken}`;
                res = await fetch(url, options);
            }
        }
    }
    return res;
}

async function refreshAccessToken() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: State.refreshToken })
        });
        if (res.ok) {
            const data = await res.json();
            State.accessToken = data.accessToken;
            State.refreshToken = data.refreshToken;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return true;
        }
    } catch (e) { /* ignore */ }

    // Refresh failed — force logout
    State.clearAuth();
    updateAuthUI();
    Toast.show('Session expired. Please sign in again.');
    return false;
}

// ==================== FORGOT PASSWORD FLOW ====================
const toForgotPassword = $('toForgotPassword');
const fpBackToLogin = $('fpBackToLogin');

if (toForgotPassword) {
    toForgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        $('loginFormContainer').style.display = 'none';
        $('signupFormContainer').style.display = 'none';
        $('forgotPasswordContainer').style.display = 'block';
        $('fpStep1').style.display = 'block';
        $('fpStep2').style.display = 'none';
        $('fpStep3').style.display = 'none';
    });
}

if (fpBackToLogin) {
    fpBackToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        $('forgotPasswordContainer').style.display = 'none';
        $('loginFormContainer').style.display = 'block';
    });
}

// Step 1: Send OTP
const forgotPasswordForm = $('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('fpEmail').value.trim();
        if (!email) { Toast.show('Please enter your email'); return; }

        const btn = forgotPasswordForm.querySelector('button[type="submit"]');
        btn.classList.add('btn-loading');
        btn.textContent = 'Sending...';

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            State.fpEmail = email;
            Toast.show('OTP sent! Check your email.');
            $('fpStep1').style.display = 'none';
            $('fpStep2').style.display = 'block';
            // Focus first OTP digit
            setTimeout(() => $('otpDigit1')?.focus(), 200);
        } catch (err) {
            Toast.error('Failed to send OTP');
        } finally {
            btn.classList.remove('btn-loading');
            btn.textContent = 'Send OTP';
        }
    });
}

// OTP digit auto-advance
for (let i = 1; i <= 6; i++) {
    const digit = $(`otpDigit${i}`);
    if (digit) {
        digit.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;
            if (val) {
                e.target.classList.add('filled');
                if (i < 6) $(`otpDigit${i + 1}`)?.focus();
            } else {
                e.target.classList.remove('filled');
            }
        });
        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !digit.value && i > 1) {
                $(`otpDigit${i - 1}`)?.focus();
            }
        });
        // Allow paste of full OTP
        digit.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
            for (let j = 0; j < pasted.length && j < 6; j++) {
                const d = $(`otpDigit${j + 1}`);
                if (d) { d.value = pasted[j]; d.classList.add('filled'); }
            }
            if (pasted.length >= 6) $('otpDigit6')?.focus();
        });
    }
}

// Step 2: Verify OTP
const verifyOtpForm = $('verifyOtpForm');
if (verifyOtpForm) {
    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let otp = '';
        for (let i = 1; i <= 6; i++) {
            otp += ($(`otpDigit${i}`)?.value || '');
        }
        if (otp.length !== 6) {
            Toast.show('Please enter the complete 6-digit OTP');
            return;
        }

        const btn = verifyOtpForm.querySelector('button[type="submit"]');
        btn.classList.add('btn-loading');

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: State.fpEmail, otp })
            });
            const data = await res.json();

            if (res.ok) {
                State.resetToken = data.resetToken;
                Toast.show('OTP verified!');
                $('fpStep2').style.display = 'none';
                $('fpStep3').style.display = 'block';
            } else {
                Toast.show(data.error || 'Invalid OTP');
            }
        } catch (err) {
            Toast.error('Verification failed');
        } finally {
            btn.classList.remove('btn-loading');
        }
    });
}

// Resend OTP
const fpResendOtp = $('fpResendOtp');
if (fpResendOtp) {
    fpResendOtp.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!State.fpEmail) return;
        try {
            await fetch(`${CONFIG.API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: State.fpEmail })
            });
            Toast.show('New OTP sent!');
        } catch (err) {
            Toast.error('Failed to resend');
        }
    });
}

// Step 3: Reset Password
const resetPasswordForm = $('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = $('fpNewPassword').value;
        const confirmPassword = $('fpConfirmPassword').value;

        if (newPassword.length < 6) {
            Toast.show('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show('Passwords do not match');
            return;
        }

        const btn = resetPasswordForm.querySelector('button[type="submit"]');
        btn.classList.add('btn-loading');

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken: State.resetToken, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                Toast.show('Password reset successfully! Please sign in.');
                // Reset and go back to login
                State.fpEmail = null;
                State.resetToken = null;
                $('forgotPasswordContainer').style.display = 'none';
                $('loginFormContainer').style.display = 'block';
                resetPasswordForm.reset();
                // Clear OTP fields
                for (let i = 1; i <= 6; i++) {
                    const d = $(`otpDigit${i}`);
                    if (d) { d.value = ''; d.classList.remove('filled'); }
                }
            } else {
                Toast.show(data.error || 'Reset failed');
            }
        } catch (err) {
            Toast.error('Reset failed');
        } finally {
            btn.classList.remove('btn-loading');
        }
    });
}

// ==================== PROFILE ====================
async function loadProfile() {
    if (!State.isAuthenticated) return;
    try {
        const res = await authFetch(`${CONFIG.API_BASE_URL}/auth/profile`);
        if (res.ok) {
            const data = await res.json();
            const user = data.user;
            State.user = user;
            localStorage.setItem('user', JSON.stringify(user));

            const avatar = $('profileAvatarLarge');
            const username = $('profileUsername');
            const email = $('profileEmail');
            const joined = $('profileJoined');

            if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
            if (username) username.textContent = user.username;
            if (email) email.textContent = user.email;
            if (joined) joined.textContent = `Joined: ${new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

            // Fill edit form
            const editUsername = $('profileEditUsername');
            const editBio = $('profileEditBio');
            const editPicture = $('profileEditPicture');

            if (editUsername) editUsername.value = user.username || '';
            if (editBio) editBio.value = user.bio || '';
            if (editPicture) editPicture.value = user.profilePicture || '';
        }
    } catch (err) {
        console.error('Failed to load profile:', err);
    }
}

// Profile form submit
const profileForm = $('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!State.isAuthenticated) return;

        const username = $('profileEditUsername')?.value.trim();
        const bio = $('profileEditBio')?.value.trim();
        const profilePicture = $('profileEditPicture')?.value.trim();

        const btn = profileForm.querySelector('button[type="submit"]');
        btn.classList.add('btn-loading');

        try {
            const res = await authFetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, bio, profilePicture })
            });
            const data = await res.json();

            if (res.ok) {
                State.user = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                updateAuthUI();
                Toast.show('Profile updated!');
                loadProfile(); // Refresh display
            } else {
                Toast.show(data.error || 'Update failed');
            }
        } catch (err) {
            Toast.error('Update failed');
        } finally {
            btn.classList.remove('btn-loading');
        }
    });
}

// Profile nav — click user avatar in sidebar
const userAvatar = $('userAvatar');
if (userAvatar) {
    userAvatar.addEventListener('click', () => {
        if (State.isAuthenticated) {
            $$('.nav-icon').forEach(n => n.classList.remove('active'));
            showView('profile');
        }
    });
}

// ==================== INITIALIZATION ====================
State.init();
updateAuthUI();
loadVideos();

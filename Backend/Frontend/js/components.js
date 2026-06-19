// ═══════════════════════════════════════════
// SHARED COMPONENTS — Navbar & Sidebar
// ═══════════════════════════════════════════

// ── SVG ICONS ──────────────────────────────
const Icons = {
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    subscriptions: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
    library: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    liked: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    channel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    thumbsUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    film: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`,
};

// ── TOAST NOTIFICATIONS ────────────────────
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast__message">${message}</span>
        <button class="toast__close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300)">✕</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── RENDER NAVBAR ──────────────────────────
function renderNavbar() {
    const user = Auth.getUser();
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.id = 'navbar';

    navbar.innerHTML = `
        <div class="navbar__left">
            <button class="navbar__menu-btn" id="menu-toggle" aria-label="Toggle menu">
                ${Icons.menu}
            </button>
            <a href="/index.html" class="navbar__logo">
                <div class="navbar__logo-icon">
                    ${Icons.play}
                </div>
                <span>ViewTube</span>
            </a>
        </div>

        <div class="navbar__center">
            <div class="navbar__search">
                <input type="text" placeholder="Search videos..." id="search-input" />
                <button class="navbar__search-btn" id="search-btn" aria-label="Search">
                    ${Icons.search}
                </button>
            </div>
        </div>

        <div class="navbar__right">
            ${user ? `
                <button class="btn-icon" title="Notifications" id="notif-btn">
                    ${Icons.bell}
                </button>
                <a href="/upload.html" class="btn-icon" title="Upload" id="upload-btn">
                    ${Icons.upload}
                </a>
                <div class="navbar__user-menu" id="user-menu">
                    <img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullname) + '&background=ff4444&color=fff&size=80'}" 
                         alt="Avatar" class="navbar__avatar" id="user-avatar-btn" />
                    <div class="navbar__dropdown" id="user-dropdown">
                        <div class="navbar__dropdown-header">
                            <img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullname) + '&background=ff4444&color=fff&size=80'}" alt="Avatar" />
                            <div>
                                <div class="name">${user.fullname || user.username}</div>
                                <div class="email">@${user.username}</div>
                            </div>
                        </div>
                        <a href="/channel.html?u=${user.username}" class="navbar__dropdown-item">
                            ${Icons.user}
                            <span>Your Channel</span>
                        </a>
                        <a href="/settings.html" class="navbar__dropdown-item">
                            ${Icons.settings}
                            <span>Settings</span>
                        </a>
                        <div class="navbar__dropdown-divider"></div>
                        <div class="navbar__dropdown-item" id="logout-btn">
                            ${Icons.logout}
                            <span>Sign Out</span>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="navbar__auth-buttons">
                    <a href="/login.html" class="btn btn-ghost">Sign In</a>
                    <a href="/register.html" class="btn btn-primary">Sign Up</a>
                </div>
            `}
        </div>
    `;

    document.body.prepend(navbar);

    // Dropdown toggle
    const avatarBtn = document.getElementById('user-avatar-btn');
    const dropdown = document.getElementById('user-dropdown');
    if (avatarBtn && dropdown) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        document.addEventListener('click', () => dropdown.classList.remove('active'));
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await api.post('/user/logout');
            } catch { /* ignore */ }
            Auth.logout();
            window.location.href = '/index.html';
        });
    }

    // Menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth <= 1024) {
                sidebar?.classList.toggle('mobile-open');
                overlay?.classList.toggle('active');
            } else {
                sidebar?.classList.toggle('collapsed');
                document.querySelector('.main-content')?.classList.toggle('sidebar-collapsed');
            }
        });
    }
}

// ── RENDER SIDEBAR ─────────────────────────
function renderSidebar(activePage = '') {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebar-overlay';
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    });

    const menuItems = [
        { section: '', items: [
            { icon: Icons.home, label: 'Home', href: '/home.html', id: 'home' },
            { icon: Icons.trending, label: 'Trending', href: '/home.html?tab=trending', id: 'trending' },
            { icon: Icons.subscriptions, label: 'Subscriptions', href: '/home.html?tab=subscriptions', id: 'subscriptions' },
        ]},
        { section: 'Library', items: [
            { icon: Icons.library, label: 'Your Videos', href: '/channel.html', id: 'your-videos' },
            { icon: Icons.history, label: 'History', href: '/home.html?tab=history', id: 'history' },
            { icon: Icons.liked, label: 'Liked Videos', href: '/home.html?tab=liked', id: 'liked' },
        ]},
        { section: 'You', items: [
            { icon: Icons.upload, label: 'Upload', href: '/upload.html', id: 'upload' },
            { icon: Icons.settings, label: 'Settings', href: '/settings.html', id: 'settings' },
        ]},
    ];

    let html = '';
    menuItems.forEach(group => {
        html += '<div class="sidebar__section">';
        if (group.section) {
            html += `<div class="sidebar__section-title">${group.section}</div>`;
        }
        group.items.forEach(item => {
            const isActive = activePage === item.id ? 'active' : '';
            html += `
                <a href="${item.href}" class="sidebar__item ${isActive}">
                    ${item.icon}
                    <span class="sidebar__label">${item.label}</span>
                </a>
            `;
        });
        html += '</div>';
    });

    sidebar.innerHTML = html;
    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);
}

// ── FORMAT HELPERS ─────────────────────────
function formatViews(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
}

function formatTimeAgo(dateString) {
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
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── MOCK VIDEO DATA ────────────────────────
const MOCK_VIDEOS = [
    {
        _id: 'v1',
        title: 'Building a Full-Stack App from Scratch',
        thumbnail: 'https://picsum.photos/seed/vid1/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '24:35',
        view: 142500,
        owner: { username: 'techmaster', fullname: 'Tech Master', avatar: 'https://ui-avatars.com/api/?name=Tech+Master&background=6366f1&color=fff' },
        createdAt: '2026-03-15T10:00:00Z',
        describtion: 'Learn how to build a complete full-stack application from scratch using modern technologies.'
    },
    {
        _id: 'v2',
        title: 'Advanced CSS Animations & Transitions Guide',
        thumbnail: 'https://picsum.photos/seed/vid2/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '18:22',
        view: 89300,
        owner: { username: 'csswhiz', fullname: 'CSS Wizard', avatar: 'https://ui-avatars.com/api/?name=CSS+Wizard&background=ec4899&color=fff' },
        createdAt: '2026-03-20T14:00:00Z',
        describtion: 'Master CSS animations and transitions with practical examples and best practices.'
    },
    {
        _id: 'v3',
        title: 'Node.js Authentication — JWT, Cookies & Sessions',
        thumbnail: 'https://picsum.photos/seed/vid3/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '32:10',
        view: 215000,
        owner: { username: 'nodedev', fullname: 'Node Developer', avatar: 'https://ui-avatars.com/api/?name=Node+Dev&background=22c55e&color=fff' },
        createdAt: '2026-02-28T08:00:00Z',
        describtion: 'Deep dive into authentication in Node.js using JWTs, cookies, and sessions.'
    },
    {
        _id: 'v4',
        title: 'React 19 — What\'s New and How to Upgrade',
        thumbnail: 'https://picsum.photos/seed/vid4/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '15:48',
        view: 320000,
        owner: { username: 'reactpro', fullname: 'React Pro', avatar: 'https://ui-avatars.com/api/?name=React+Pro&background=3b82f6&color=fff' },
        createdAt: '2026-04-01T12:00:00Z',
        describtion: 'Explore all the new features in React 19 and learn how to upgrade your existing projects.'
    },
    {
        _id: 'v5',
        title: 'MongoDB Aggregation Pipeline Deep Dive',
        thumbnail: 'https://picsum.photos/seed/vid5/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '28:55',
        view: 67800,
        owner: { username: 'dbguru', fullname: 'Database Guru', avatar: 'https://ui-avatars.com/api/?name=DB+Guru&background=f59e0b&color=fff' },
        createdAt: '2026-03-10T16:00:00Z',
        describtion: 'A comprehensive guide to MongoDB aggregation pipelines with real-world examples.'
    },
    {
        _id: 'v6',
        title: 'Designing Beautiful Dark Mode UIs',
        thumbnail: 'https://picsum.photos/seed/vid6/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '12:30',
        view: 198000,
        owner: { username: 'uidesigner', fullname: 'UI Designer', avatar: 'https://ui-avatars.com/api/?name=UI+Designer&background=8b5cf6&color=fff' },
        createdAt: '2026-04-05T09:00:00Z',
        describtion: 'Learn the principles of designing stunning dark mode user interfaces.'
    },
    {
        _id: 'v7',
        title: 'Docker & Kubernetes for Beginners',
        thumbnail: 'https://picsum.photos/seed/vid7/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '45:20',
        view: 410000,
        owner: { username: 'devops101', fullname: 'DevOps 101', avatar: 'https://ui-avatars.com/api/?name=DevOps&background=14b8a6&color=fff' },
        createdAt: '2026-01-20T11:00:00Z',
        describtion: 'Get started with Docker and Kubernetes from absolute zero.'
    },
    {
        _id: 'v8',
        title: 'TypeScript Best Practices 2026',
        thumbnail: 'https://picsum.photos/seed/vid8/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '20:15',
        view: 125000,
        owner: { username: 'tspro', fullname: 'TypeScript Pro', avatar: 'https://ui-avatars.com/api/?name=TS+Pro&background=0ea5e9&color=fff' },
        createdAt: '2026-03-25T15:00:00Z',
        describtion: 'The ultimate guide to TypeScript best practices for 2026.'
    },
    {
        _id: 'v9',
        title: 'Git & GitHub Workflow for Teams',
        thumbnail: 'https://picsum.photos/seed/vid9/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '22:40',
        view: 93000,
        owner: { username: 'gitmaster', fullname: 'Git Master', avatar: 'https://ui-avatars.com/api/?name=Git+Master&background=ef4444&color=fff' },
        createdAt: '2026-02-14T13:00:00Z',
        describtion: 'Learn professional Git and GitHub workflows for team collaboration.'
    },
    {
        _id: 'v10',
        title: 'REST API Design — The Complete Guide',
        thumbnail: 'https://picsum.photos/seed/vid10/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '35:12',
        view: 278000,
        owner: { username: 'apiarch', fullname: 'API Architect', avatar: 'https://ui-avatars.com/api/?name=API+Arch&background=a855f7&color=fff' },
        createdAt: '2026-03-01T10:00:00Z',
        describtion: 'Design robust and scalable REST APIs following industry best practices.'
    },
    {
        _id: 'v11',
        title: 'WebSocket Real-time Chat Application',
        thumbnail: 'https://picsum.photos/seed/vid11/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '40:05',
        view: 156000,
        owner: { username: 'techmaster', fullname: 'Tech Master', avatar: 'https://ui-avatars.com/api/?name=Tech+Master&background=6366f1&color=fff' },
        createdAt: '2026-04-08T18:00:00Z',
        describtion: 'Build a real-time chat application using WebSockets and Node.js.'
    },
    {
        _id: 'v12',
        title: 'Responsive Web Design Masterclass',
        thumbnail: 'https://picsum.photos/seed/vid12/640/360',
        videoFile: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '27:33',
        view: 185000,
        owner: { username: 'csswhiz', fullname: 'CSS Wizard', avatar: 'https://ui-avatars.com/api/?name=CSS+Wizard&background=ec4899&color=fff' },
        createdAt: '2026-03-18T07:00:00Z',
        describtion: 'Master responsive web design techniques for all screen sizes.'
    },
];

// ── VIDEO CARD COMPONENT ───────────────────
function createVideoCard(video) {
    const card = document.createElement('a');
    card.href = `/watch.html?v=${video._id}`;
    card.className = 'video-card';
    card.innerHTML = `
        <div class="video-card__thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" />
            <span class="video-card__duration">${video.duration}</span>
            <div class="video-card__play-overlay">
                <div class="video-card__play-btn">${Icons.play}</div>
            </div>
        </div>
        <div class="video-card__info">
            <img src="${video.owner.avatar}" alt="${video.owner.fullname}" class="video-card__avatar" />
            <div class="video-card__meta">
                <h4 class="video-card__title">${video.title}</h4>
                <a href="/channel.html?u=${video.owner.username}" class="video-card__channel">${video.owner.fullname}</a>
                <div class="video-card__stats">
                    <span>${formatViews(video.view)} views</span>
                    <span>•</span>
                    <span>${formatTimeAgo(video.createdAt)}</span>
                </div>
            </div>
        </div>
    `;
    return card;
}

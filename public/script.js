const API_BASE_URL = '/api';

// DOM Elements
const homeView = document.getElementById('homeView');
const uploadView = document.getElementById('uploadView');
const playerView = document.getElementById('playerView');
const videoGrid = document.getElementById('videoGrid');
const uploadForm = document.getElementById('uploadForm');
const videoPlayer = document.getElementById('videoPlayer');
const playerTitle = document.getElementById('playerTitle');
const playerDescription = document.getElementById('playerDescription');
const playerViews = document.getElementById('playerViews');
const playerDate = document.getElementById('playerDate');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const relatedVideos = document.getElementById('relatedVideos');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const uploadHeaderBtn = document.getElementById('uploadHeaderBtn');
const uploadNavBtn = document.getElementById('uploadNavBtn');
const navItems = document.querySelectorAll('.nav-item');
const videoFile = document.getElementById('videoFile');
const fileLabelText = document.getElementById('fileLabelText');

let allVideos = [];
let currentVideoId = null;

// Sidebar toggle
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        
        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        showView(view);
    });
});

uploadHeaderBtn.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    uploadNavBtn.classList.add('active');
    showView('upload');
});

// Search
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
        filterVideos(query);
    } else {
        loadVideos();
    }
});

// File input handler
videoFile.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        fileLabelText.textContent = e.target.files[0].name;
    } else {
        fileLabelText.textContent = 'Select video file';
    }
});

function showView(viewName) {
    homeView.classList.remove('active');
    uploadView.classList.remove('active');
    playerView.classList.remove('active');

    if (viewName === 'home' || viewName === 'trending' || viewName === 'library') {
        homeView.classList.add('active');
        loadVideos();
    } else if (viewName === 'upload') {
        uploadView.classList.add('active');
    } else if (viewName === 'player') {
        playerView.classList.add('active');
    }
}

// Load all videos
async function loadVideos() {
    try {
        videoGrid.innerHTML = '<div class="loading">Loading videos...</div>';
        const response = await fetch(`${API_BASE_URL}/videos`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        allVideos = await response.json();
        console.log('Loaded videos:', allVideos);

        if (allVideos.length === 0) {
            videoGrid.innerHTML = '<div class="loading">No videos available. Upload one to get started!</div>';
            return;
        }

        displayVideos(allVideos);
    } catch (error) {
        console.error('Error loading videos:', error);
        videoGrid.innerHTML = `<div class="loading" style="color: #ff0000;">Error loading videos: ${error.message}<br><small>Check console for details. Make sure MongoDB is connected.</small></div>`;
    }
}

// Filter videos
function filterVideos(query) {
    const filtered = allVideos.filter(video => 
        video.title.toLowerCase().includes(query) ||
        (video.description && video.description.toLowerCase().includes(query))
    );
    displayVideos(filtered);
}

// Display videos
function displayVideos(videos) {
    videoGrid.innerHTML = '';
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        videoGrid.appendChild(videoCard);
    });
}

// Create video card element
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const channelInitial = video.title.charAt(0).toUpperCase();
    const viewsText = formatViews(video.views);
    const timeAgo = getTimeAgo(video.uploadDate);
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <span>▶</span>
        </div>
        <div class="video-card-info">
            <div class="channel-avatar">${channelInitial}</div>
            <div class="video-details">
                <h3>${escapeHtml(video.title)}</h3>
                <div class="channel-name">Video Channel</div>
                <div class="video-meta">
                    <span>${viewsText}</span>
                    <span>•</span>
                    <span>${timeAgo}</span>
                </div>
            </div>
        </div>
    `;
    card.addEventListener('click', () => playVideo(video._id));
    return card;
}

// Play video
async function playVideo(videoId) {
    try {
        currentVideoId = videoId;
        const response = await fetch(`${API_BASE_URL}/videos/${videoId}`);
        
        if (!response.ok) {
            throw new Error('Video not found');
        }
        
        const video = await response.json();

        playerTitle.textContent = video.title;
        playerDescription.textContent = video.description || 'No description available.';
        playerViews.textContent = formatViews(video.views) + ' views';
        playerDate.textContent = getTimeAgo(video.uploadDate);
        
        // Set video source and handle errors
        videoPlayer.onerror = () => {
            console.error('Error loading video file');
            alert('Error loading video. The video file may be corrupted or missing.');
        };
        
        videoPlayer.onloadeddata = () => {
            console.log('Video loaded successfully');
        };
        
        videoPlayer.src = `${API_BASE_URL}/videos/${videoId}/stream`;
        showView('player');
        
        // Load related videos
        loadRelatedVideos(videoId);
    } catch (error) {
        console.error('Error loading video:', error);
        alert('Error loading video. Please try again.');
    }
}

// Load related videos
async function loadRelatedVideos(excludeId) {
    try {
        const related = allVideos.filter(v => v._id !== excludeId).slice(0, 10);
        displayRelatedVideos(related);
    } catch (error) {
        console.error('Error loading related videos:', error);
    }
}

// Display related videos
function displayRelatedVideos(videos) {
    relatedVideos.innerHTML = '';
    
    if (videos.length === 0) {
        relatedVideos.innerHTML = '<div class="loading">No related videos</div>';
        return;
    }
    
    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'related-video-card';
        
        const channelInitial = video.title.charAt(0).toUpperCase();
        const viewsText = formatViews(video.views);
        const timeAgo = getTimeAgo(video.uploadDate);
        
        card.innerHTML = `
            <div class="related-thumbnail">
                <span>▶</span>
            </div>
            <div class="related-info">
                <h4>${escapeHtml(video.title)}</h4>
                <div class="related-meta">
                    <div>Video Channel</div>
                    <div>${viewsText} • ${timeAgo}</div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => playVideo(video._id));
        relatedVideos.appendChild(card);
    });
}

// Upload form handler
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(uploadForm);
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDescription').value;
    const fileInput = document.getElementById('videoFile');

    if (!fileInput.files[0]) {
        alert('Please select a video file');
        return;
    }

    formData.append('title', title);
    formData.append('description', description);

    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading...';

    try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = `Uploading... ${Math.round(percentComplete)}%`;
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 201) {
                progressFill.style.width = '100%';
                progressText.textContent = 'Upload complete!';
                setTimeout(() => {
                    uploadForm.reset();
                    fileLabelText.textContent = 'Select video file';
                    uploadProgress.style.display = 'none';
                    showView('home');
                    loadVideos();
                }, 1500);
            } else {
                const response = JSON.parse(xhr.responseText || '{}');
                const errorMsg = response.error || 'Upload failed';
                throw new Error(errorMsg);
            }
        });

        xhr.addEventListener('error', () => {
            throw new Error('Network error. Please check your connection.');
        });

        xhr.open('POST', `${API_BASE_URL}/upload`);
        xhr.send(formData);
    } catch (error) {
        console.error('Error uploading video:', error);
        alert(`Error uploading video: ${error.message}\n\nIf you see "Database not connected", please check your MongoDB connection.`);
        uploadProgress.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = 'Upload failed';
    }
});

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M views';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K views';
    }
    return views + ' views';
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return days + (days === 1 ? ' day ago' : ' days ago');
    } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return months + (months === 1 ? ' month ago' : ' months ago');
    } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return years + (years === 1 ? ' year ago' : ' years ago');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// Load videos on page load
loadVideos();

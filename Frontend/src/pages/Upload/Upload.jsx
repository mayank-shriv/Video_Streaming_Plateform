import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiFilm, FiImage, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { videoService } from '../../services/api';
import toast from 'react-hot-toast';
import styles from './Upload.module.css';

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  // ── Drag & Drop handlers ──
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    } else {
      toast.error('Please drop a valid video file');
    }
  }, []);

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onload = (ev) => setThumbnailPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('isPublished', isPublished);
    if (thumbnail) formData.append('thumbnail', thumbnail);

    try {
      await videoService.upload(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(pct);
      });
      toast.success('Video uploaded successfully!');
      navigate('/home');
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Upload Video</h1>
          <p className={styles.subtitle}>Share your content with the world</p>
        </div>

        {/* Drop Zone / Selected File */}
        {!videoFile ? (
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dropZoneDragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => videoInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && videoInputRef.current?.click()}
          >
            <FiUploadCloud className={styles.dropIcon} />
            <p className={styles.dropText}>
              Drag & drop your video here, or <strong>browse</strong>
            </p>
            <p className={styles.dropHint}>MP4, WebM, or QuickTime • No size limit</p>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className={styles.hiddenInput}
              onChange={handleVideoSelect}
            />
          </div>
        ) : (
          <div className={styles.selectedFile}>
            <FiFilm className={styles.fileIcon} />
            <div className={styles.fileInfo}>
              <div className={styles.fileName}>{videoFile.name}</div>
              <div className={styles.fileSize}>{formatFileSize(videoFile.size)}</div>
            </div>
            {!uploading && (
              <button className={styles.removeBtn} onClick={removeVideo} type="button" aria-label="Remove file">
                <FiX />
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Title */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="text"
              placeholder="Give your video a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              maxLength={150}
              required
            />
          </div>

          {/* Description */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Tell viewers about your video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              maxLength={5000}
            />
          </div>

          {/* Thumbnail */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Thumbnail</label>
            <div
              className={styles.thumbnailZone}
              onClick={() => thumbnailInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && thumbnailInputRef.current?.click()}
            >
              {thumbnailPreview ? (
                <>
                  <img src={thumbnailPreview} alt="Thumbnail preview" className={styles.thumbnailPreview} />
                  <div className={styles.thumbnailOverlay}>
                    <FiImage /> Change thumbnail
                  </div>
                </>
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <FiImage />
                  <span>Click to upload thumbnail</span>
                </div>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={styles.hiddenInput}
                onChange={handleThumbnailSelect}
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className={styles.toggleRow}>
            <div className={styles.toggleLabel}>
              <span className={styles.toggleTitle}>
                {isPublished ? 'Published' : 'Draft'}
              </span>
              <span className={styles.toggleDesc}>
                {isPublished
                  ? 'Anyone can find and watch this video'
                  : 'Only you can see this video'}
              </span>
            </div>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
                disabled={uploading}
              />
              <span className={styles.slider} />
            </label>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className={styles.progressContainer}>
              <div className={styles.progressLabel}>
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={uploading || !videoFile || !title.trim()}
          >
            {uploading ? (
              <>
                <span className={styles.spinner} />
                Uploading...
              </>
            ) : (
              <>
                <FiUploadCloud />
                Upload Video
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

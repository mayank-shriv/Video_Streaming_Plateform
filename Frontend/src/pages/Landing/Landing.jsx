import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiUpload,
    FiMonitor,
    FiUsers,
    FiBarChart2,
    FiSmartphone,
    FiShield,
    FiPlay,
    FiArrowRight,
} from 'react-icons/fi';
import styles from './Landing.module.css';

const FEATURES = [
    {
        icon: FiUpload,
        title: 'Easy Uploads',
        description:
            'Drag, drop, done. Upload videos in any format with lightning-fast processing and automatic quality optimization.',
    },
    {
        icon: FiMonitor,
        title: 'HD Streaming',
        description:
            'Crystal-clear playback up to 4K resolution with adaptive bitrate streaming that adjusts to your connection.',
    },
    {
        icon: FiUsers,
        title: 'Build Community',
        description:
            'Engage your audience with comments, likes, and subscriptions. Build a loyal community around your content.',
    },
    {
        icon: FiBarChart2,
        title: 'Creator Dashboard',
        description:
            'Track views, engagement, and growth with real-time analytics. Understand your audience like never before.',
    },
    {
        icon: FiSmartphone,
        title: 'Cross-Platform',
        description:
            'Watch anywhere, anytime. Seamless experience across desktop, tablet, and mobile with responsive design.',
    },
    {
        icon: FiShield,
        title: 'Secure & Private',
        description:
            'Your content, your rules. Enterprise-grade encryption and granular privacy controls keep your data safe.',
    },
];

const FLOATING_THUMBNAILS = [
    'https://picsum.photos/seed/vt1/400/225',
    'https://picsum.photos/seed/vt2/400/225',
    'https://picsum.photos/seed/vt3/400/225',
    'https://picsum.photos/seed/vt4/400/225',
];

export default function Landing() {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const featureRefs = useRef([]);

    // Redirect authenticated users
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/home', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    // Scroll listener for navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // IntersectionObserver for feature cards
    const setFeatureRef = useCallback((el, index) => {
        if (el) featureRefs.current[index] = el;
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Stagger the animation based on card index
                        const idx = Number(entry.target.dataset.index);
                        const delay = idx * 100;
                        setTimeout(() => {
                            entry.target.classList.add(styles.visible);
                        }, delay);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        const refs = featureRefs.current;
        refs.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            refs.forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, []);

    // Don't render landing if user is authenticated (avoid flash)
    if (!loading && isAuthenticated) return null;

    return (
        <div className={styles.landing}>
            {/* ── Navbar ──────────────────────────── */}
            <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
                <Link to="/" className={styles.navBrand}>
                    <span className={styles.navBrandIcon}>
                        <FiPlay />
                    </span>
                    ViewTube
                </Link>

                <div className={styles.navLinks}>
                    <a href="#features" className={styles.navLink}>Features</a>
                    <a href="#cta" className={styles.navLink}>Pricing</a>
                    <a href="#footer" className={styles.navLink}>About</a>
                </div>

                <div className={styles.navActions}>
                    <Link to="/login" className={styles.btnSignIn}>
                        Sign In
                    </Link>
                    <Link to="/register" className={styles.btnGetStarted}>
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────── */}
            <section className={styles.hero}>
                {/* Background layers */}
                <div className={styles.heroBg} />
                <div className={`${styles.blob} ${styles.blob1}`} />
                <div className={`${styles.blob} ${styles.blob2}`} />
                <div className={`${styles.blob} ${styles.blob3}`} />
                <div className={styles.gridOverlay} />

                {/* Floating video preview cards */}
                <div className={styles.floatingCards}>
                    {FLOATING_THUMBNAILS.map((src, i) => (
                        <div
                            key={i}
                            className={`${styles.floatingCard} ${styles[`floatingCard${i + 1}`]}`}
                        >
                            <img
                                src={src}
                                alt={`Preview ${i + 1}`}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className={styles.heroContent}>
                    <div className={styles.heroBadge}>
                        <span className={styles.badgeDot} />
                        Now Streaming in HD
                    </div>

                    <h1 className={styles.heroTitle}>
                        The Future of{' '}
                        <span className={styles.heroTitleAccent}>
                            Video Streaming
                        </span>
                    </h1>

                    <p className={styles.heroSubtitle}>
                        Upload, share, and discover amazing videos. Join a
                        thriving community of creators and viewers on the
                        platform built for the next generation.
                    </p>

                    <div className={styles.heroButtons}>
                        <Link to="/register" className={styles.btnPrimary}>
                            Get Started Free
                            <FiArrowRight />
                        </Link>
                        <button className={styles.btnSecondary}>
                            <FiPlay />
                            Watch Demo
                        </button>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>10K+</div>
                            <div className={styles.statLabel}>Creators</div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>500K+</div>
                            <div className={styles.statLabel}>Videos</div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>2M+</div>
                            <div className={styles.statLabel}>Views</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ────────────────────────── */}
            <section id="features" className={styles.features}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Features</span>
                    <h2 className={styles.sectionTitle}>
                        Everything You Need to Create
                    </h2>
                    <p className={styles.sectionSubtitle}>
                        Powerful tools and features designed to help creators
                        produce, publish, and grow their audience effortlessly.
                    </p>
                </div>

                <div className={styles.featureGrid}>
                    {FEATURES.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className={styles.featureCard}
                                ref={(el) => setFeatureRef(el, index)}
                                data-index={index}
                            >
                                <div className={styles.featureIconContainer}>
                                    <Icon />
                                </div>
                                <h3 className={styles.featureTitle}>
                                    {feature.title}
                                </h3>
                                <p className={styles.featureDescription}>
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── CTA ─────────────────────────────── */}
            <section id="cta" className={styles.cta}>
                <div className={styles.ctaBg} />
                <div className={styles.ctaContent}>
                    <h2 className={styles.ctaTitle}>
                        Ready to Start Creating?
                    </h2>
                    <p className={styles.ctaDescription}>
                        Join thousands of creators who are already sharing
                        their stories with the world. It&apos;s free to get
                        started.
                    </p>
                    <Link to="/register" className={styles.ctaButton}>
                        Create Your Channel
                        <FiArrowRight />
                    </Link>
                </div>
            </section>

            {/* ── Footer ──────────────────────────── */}
            <footer id="footer" className={styles.footer}>
                <div className={styles.footerGrid}>
                    {/* Brand column */}
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>
                            <span className={styles.footerLogoIcon}>
                                <FiPlay />
                            </span>
                            ViewTube
                        </div>
                        <p className={styles.footerBrandDescription}>
                            The next-generation video streaming platform built
                            for creators and viewers who demand the best
                            experience.
                        </p>
                    </div>

                    {/* Product links */}
                    <div className={styles.footerColumn}>
                        <span className={styles.footerColumnTitle}>Product</span>
                        <a href="#features" className={styles.footerLink}>Features</a>
                        <a href="#cta" className={styles.footerLink}>Pricing</a>
                        <span className={styles.footerLink}>API</span>
                        <span className={styles.footerLink}>Integrations</span>
                    </div>

                    {/* Company links */}
                    <div className={styles.footerColumn}>
                        <span className={styles.footerColumnTitle}>Company</span>
                        <span className={styles.footerLink}>About</span>
                        <span className={styles.footerLink}>Blog</span>
                        <span className={styles.footerLink}>Careers</span>
                        <span className={styles.footerLink}>Press</span>
                    </div>

                    {/* Support links */}
                    <div className={styles.footerColumn}>
                        <span className={styles.footerColumnTitle}>Support</span>
                        <span className={styles.footerLink}>Help Center</span>
                        <span className={styles.footerLink}>Community</span>
                        <span className={styles.footerLink}>Contact Us</span>
                        <span className={styles.footerLink}>Status</span>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <span className={styles.footerCopyright}>
                        © {new Date().getFullYear()} ViewTube. All rights reserved.
                    </span>
                    <div className={styles.footerBottomLinks}>
                        <span className={styles.footerBottomLink}>Privacy Policy</span>
                        <span className={styles.footerBottomLink}>Terms of Service</span>
                        <span className={styles.footerBottomLink}>Cookie Policy</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

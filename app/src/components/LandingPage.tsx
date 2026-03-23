import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Target,
    MapPin,
    Command,
    Bot,
    Scale,
    Check,
    X,
    ArrowRight,
    ChevronRight,
    ExternalLink,
    Menu,
    Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Intersection-observer hook for scroll animations                   */
/* ------------------------------------------------------------------ */
function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
}

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useCounter(target: number, duration = 1400, isActive = false) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!isActive) return;
        let start = 0;
        const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setValue(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isActive, target, duration]);
    return value;
}

/* ------------------------------------------------------------------ */
/*  Section wrapper with fade-in                                       */
/* ------------------------------------------------------------------ */
function FadeSection({ children, className = "", delay = 0 }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const { ref, isVisible } = useInView(0.1);
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
            }}
        >
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Feature data                                                       */
/* ------------------------------------------------------------------ */
const FEATURES = [
    {
        icon: Search,
        title: "Unified Discovery",
        desc: "One feed. Five platforms. Every open hackathon from Devpost, Devfolio, MLH, HackerEarth, and Unstop — refreshed every 12 hours.",
    },
    {
        icon: Target,
        title: "Skill-Matched Ranking",
        desc: "Select your skills. See a transparent match score on every card. 70% coverage + 30% density — no black-box AI.",
    },
    {
        icon: MapPin,
        title: "Smart Location Mix",
        desc: "Online events globally + offline events within your radius. Set Delhi NCR, 50km — see only what you can actually attend.",
    },
    {
        icon: Command,
        title: "Command Palette",
        desc: 'Press ⌘K and type "AI hackathons near Bangalore closing in 3 days". Natural language → instant filters. Zero clicks.',
    },
    {
        icon: Bot,
        title: "Medo AI Copilot",
        desc: "One click generates a full project plan: architecture, build plan, judging alignment, submission kit, and risk mitigation.",
    },
    {
        icon: Scale,
        title: "Side-by-Side Compare",
        desc: "Can't decide? Select up to 3 hackathons and compare source, format, timeline, themes, prizes, and organizer trust.",
    },
];

const COMPARISON_ROWS = [
    { feature: "Multi-platform feed", hh: "5 sources", dp: "Own only", df: "Own only", mlh: "Own only" },
    { feature: "Skill-matched ranking", hh: "Transparent score", dp: null, df: null, mlh: null },
    { feature: "Natural language search", hh: "⌘K palette", dp: null, df: null, mlh: null },
    { feature: "Location radius filter", hh: "25 cities + GPS", dp: null, df: "Basic", mlh: null },
    { feature: "AI project planner", hh: "Medo copilot", dp: null, df: null, mlh: null },
    { feature: "Side-by-side compare", hh: "Up to 3", dp: null, df: null, mlh: null },
    { feature: "Registration window filter", hh: "1-60 days", dp: null, df: null, mlh: null },
    { feature: "No login required", hh: true, dp: "Required", df: "Required", mlh: true },
];

const PLATFORMS = ["Devpost", "Devfolio", "MLH", "HackerEarth", "Unstop"];

/* ------------------------------------------------------------------ */
/*  Abstract Dashboard Mockup (CSS-only)                               */
/* ------------------------------------------------------------------ */
function DashboardMockup() {
    return (
        <div className="mockup-container" style={{
            perspective: "1200px",
            maxWidth: 980,
            margin: "0 auto",
        }}>
            <div style={{
                transform: "rotateX(2deg)",
                borderRadius: 24,
                border: "1px solid #27272a",
                overflow: "hidden",
                boxShadow: "0 40px 120px -30px rgba(251, 191, 36, 0.12), 0 20px 60px -20px rgba(0, 0, 0, 0.6)",
                display: "grid",
                gridTemplateColumns: "260px 1fr",
                height: 420,
                backgroundColor: "#18181b",
            }}>
                {/* Sidebar mock */}
                <div style={{
                    borderRight: "1px solid #27272a",
                    padding: "20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    background: "linear-gradient(180deg, #1c1c1f 0%, #18181b 100%)",
                }}>
                    <div style={{
                        background: "#27272a",
                        borderRadius: 16,
                        padding: "14px 12px",
                    }}>
                        <div style={{ height: 14, width: "70%", background: "#fafafa", borderRadius: 4, marginBottom: 6 }} />
                        <div style={{ height: 8, width: "90%", background: "#3f3f46", borderRadius: 4 }} />
                        <div style={{
                            marginTop: 12,
                            height: 32,
                            borderRadius: 8,
                            background: "#3f3f46",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 10px",
                        }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#52525b" }} />
                            <div style={{ height: 6, width: "60%", background: "#52525b", borderRadius: 3, marginLeft: 8 }} />
                        </div>
                    </div>

                    <div style={{ fontSize: 9, color: "#52525b", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 4 }}>FORMAT</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {["Online", "Offline", "Hybrid"].map((f) => (
                            <div key={f} style={{
                                height: 28,
                                borderRadius: 8,
                                background: "#27272a",
                                border: "1px solid #3f3f46",
                                display: "flex",
                                alignItems: "center",
                                padding: "0 10px",
                                fontSize: 10,
                                color: "#a1a1aa",
                            }}>{f}</div>
                        ))}
                    </div>

                    <div style={{ fontSize: 9, color: "#52525b", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 8 }}>THEMES</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {["AI/ML", "Web3", "Cloud", "Design"].map((t) => (
                            <div key={t} style={{
                                padding: "3px 8px",
                                borderRadius: 999,
                                background: t === "AI/ML" ? "#f59e0b" : "#27272a",
                                color: t === "AI/ML" ? "#18181b" : "#71717a",
                                fontSize: 9,
                                fontWeight: t === "AI/ML" ? 600 : 400,
                                border: `1px solid ${t === "AI/ML" ? "#f59e0b" : "#3f3f46"}`,
                            }}>{t}</div>
                        ))}
                    </div>
                </div>

                {/* Main content mock */}
                <div style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    background: "linear-gradient(180deg, #f4f4f5 0%, #e4e4e7 100%)",
                    overflow: "hidden",
                }}>
                    <div style={{
                        background: "#18181b",
                        borderRadius: 16,
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <div>
                            <div style={{ height: 12, width: 120, background: "#fafafa", borderRadius: 4, marginBottom: 4 }} />
                            <div style={{ height: 6, width: 200, background: "#3f3f46", borderRadius: 3 }} />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            <div style={{ padding: "4px 12px", borderRadius: 8, background: "#fafafa", height: 24, width: 40 }} />
                            <div style={{ padding: "4px 12px", borderRadius: 8, background: "#27272a", height: 24, width: 70 }} />
                        </div>
                    </div>

                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{
                            background: "rgba(255,255,255,0.98)",
                            borderRadius: 14,
                            border: "1px solid #e4e4e7",
                            padding: "12px 16px",
                            display: "grid",
                            gridTemplateColumns: "1fr 140px 160px",
                            gap: 8,
                            alignItems: "center",
                            opacity: i === 3 ? 0.5 : 1,
                        }}>
                            <div>
                                <div style={{ height: 10, width: `${70 - i * 10}%`, background: "#18181b", borderRadius: 3, marginBottom: 6 }} />
                                <div style={{ display: "flex", gap: 4 }}>
                                    <div style={{ padding: "2px 8px", borderRadius: 999, background: "#f4f4f5", border: "1px solid #e4e4e7", height: 16, width: 48 }} />
                                    <div style={{ padding: "2px 8px", borderRadius: 999, background: "#f4f4f5", border: "1px solid #e4e4e7", height: 16, width: 40 }} />
                                    {i === 1 && <div style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", height: 16, width: 64 }} />}
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                                <div style={{ height: 6, width: "80%", background: "#a1a1aa", borderRadius: 3 }} />
                                <div style={{ height: 5, width: "60%", background: "#d4d4d8", borderRadius: 3 }} />
                            </div>
                            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                                {["Save", "Compare", "Apply"].map((a) => (
                                    <div key={a} style={{
                                        padding: "3px 8px",
                                        borderRadius: 6,
                                        border: "1px solid #e4e4e7",
                                        fontSize: 8,
                                        color: "#71717a",
                                        background: a === "Apply" ? "#18181b" : "white",
                                        ...(a === "Apply" ? { color: "white" } : {}),
                                    }}>{a}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Comparison cell                                                    */
/* ------------------------------------------------------------------ */
function CompCell({ value, isHH }: { value: string | boolean | null; isHH?: boolean }) {
    if (value === true) {
        return <Check className="w-4 h-4 mx-auto" style={{ color: isHH ? "#f59e0b" : "#71717a" }} />;
    }
    if (value === null) {
        return <X className="w-4 h-4 mx-auto" style={{ color: "#d4d4d8" }} />;
    }
    if (typeof value === "string" && (value === "Required" || value === "Own only" || value === "Basic")) {
        return (
            <span className="flex items-center justify-center gap-1 text-xs" style={{ color: "#a1a1aa" }}>
                <X className="w-3 h-3" style={{ color: "#d4d4d8" }} />
                {value}
            </span>
        );
    }
    return (
        <span className="flex items-center justify-center gap-1 text-xs font-medium" style={{ color: isHH ? "#f59e0b" : "#71717a" }}>
            {isHH && <Check className="w-3 h-3" />}
            {value}
        </span>
    );
}

/* ================================================================== */
/*  MAIN LANDING PAGE COMPONENT                                        */
/* ================================================================== */
export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const statsSection = useInView(0.3);

    const hackathonCount = useCounter(325, 1400, statsSection.isVisible);
    const platformCount = useCounter(5, 800, statsSection.isVisible);
    const cityCount = useCounter(25, 1000, statsSection.isVisible);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <div style={{ backgroundColor: "#09090b", minHeight: "100vh" }}>
            {/* ============================================================ */}
            {/*  STICKY NAVBAR                                                */}
            {/* ============================================================ */}
            <nav style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 32px",
                background: scrolled ? "rgba(9,9,11,0.88)" : "transparent",
                backdropFilter: scrolled ? "blur(14px)" : "none",
                borderBottom: scrolled ? "1px solid rgba(63,63,70,0.4)" : "1px solid transparent",
                transition: "all 0.3s ease",
            }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", letterSpacing: "-0.02em" }}>
                    HackHunt
                </span>

                {/* Desktop links */}
                <div className="nav-links" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 28,
                }}>
                    {["Features", "How It Works", "Compare"].map((label) => (
                        <a
                            key={label}
                            href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                            style={{
                                color: "#a1a1aa",
                                fontSize: 13,
                                fontWeight: 500,
                                textDecoration: "none",
                                transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#fafafa")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                        >
                            {label}
                        </a>
                    ))}
                    <Link
                        to="/app"
                        style={{
                            background: "#f59e0b",
                            color: "#18181b",
                            fontSize: 13,
                            fontWeight: 600,
                            padding: "8px 20px",
                            borderRadius: 10,
                            textDecoration: "none",
                            transition: "all 0.2s",
                            boxShadow: "0 4px 16px -4px rgba(245,158,11,0.3)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#d97706"; e.currentTarget.style.transform = "scale(1.02)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.transform = "scale(1)"; }}
                    >
                        Launch App →
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenu(!mobileMenu)}
                    style={{
                        display: "none",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#a1a1aa",
                    }}
                >
                    <Menu className="w-6 h-6" />
                </button>
            </nav>

            {/* Mobile dropdown */}
            {mobileMenu && (
                <div style={{
                    position: "fixed",
                    top: 64,
                    left: 0,
                    right: 0,
                    zIndex: 99,
                    background: "rgba(9,9,11,0.96)",
                    backdropFilter: "blur(14px)",
                    borderBottom: "1px solid #27272a",
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}>
                    {["Features", "How It Works", "Compare"].map((label) => (
                        <a
                            key={label}
                            href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                            onClick={() => setMobileMenu(false)}
                            style={{ color: "#d4d4d8", fontSize: 15, textDecoration: "none" }}
                        >{label}</a>
                    ))}
                    <Link to="/app" onClick={() => setMobileMenu(false)} style={{
                        background: "#f59e0b",
                        color: "#18181b",
                        padding: "10px 20px",
                        borderRadius: 10,
                        textDecoration: "none",
                        fontWeight: 600,
                        textAlign: "center",
                    }}>
                        Launch App →
                    </Link>
                </div>
            )}

            {/* ============================================================ */}
            {/*  SECTION 1: HERO                                              */}
            {/* ============================================================ */}
            <section style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "120px 24px 80px",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Spotlight glow */}
                <div style={{
                    position: "absolute",
                    top: "20%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 800,
                    height: 500,
                    background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <FadeSection className="text-center" style={{ position: "relative", zIndex: 1 } as any}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 16px",
                        borderRadius: 999,
                        border: "1px solid rgba(245,158,11,0.25)",
                        background: "rgba(245,158,11,0.06)",
                        fontSize: 12,
                        color: "#fbbf24",
                        fontWeight: 500,
                        marginBottom: 28,
                    }}>
                        <Zap className="w-3.5 h-3.5" />
                        Built for LovHack × Medo 2026
                    </div>
                </FadeSection>

                <FadeSection className="text-center" delay={0.1}>
                    <h1 style={{
                        fontSize: "clamp(40px, 8vw, 80px)",
                        fontWeight: 800,
                        color: "#fafafa",
                        lineHeight: 1.05,
                        letterSpacing: "-0.035em",
                        maxWidth: 800,
                        margin: "0 auto 24px",
                    }}>
                        Stop Searching.{" "}
                        <span style={{ color: "#f59e0b" }}>Start Hacking.</span>
                    </h1>
                </FadeSection>

                <FadeSection className="text-center" delay={0.2}>
                    <p style={{
                        fontSize: "clamp(16px, 2vw, 19px)",
                        color: "#a1a1aa",
                        lineHeight: 1.65,
                        maxWidth: 620,
                        margin: "0 auto 36px",
                    }}>
                        HackHunt aggregates hackathons from Devpost, Devfolio, MLH, HackerEarth, and
                        Unstop — then ranks them by your skills and generates AI execution plans
                        with Medo.
                    </p>
                </FadeSection>

                <FadeSection className="text-center" delay={0.3}>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                        <Link to="/app" style={{
                            background: "#f59e0b",
                            color: "#18181b",
                            fontSize: 16,
                            fontWeight: 700,
                            padding: "14px 32px",
                            borderRadius: 12,
                            textDecoration: "none",
                            boxShadow: "0 8px 28px -8px rgba(245,158,11,0.35)",
                            transition: "all 0.25s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                        }}>
                            Launch App <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a href="#features" style={{
                            border: "1px solid #3f3f46",
                            color: "#d4d4d8",
                            fontSize: 16,
                            fontWeight: 500,
                            padding: "14px 32px",
                            borderRadius: 12,
                            textDecoration: "none",
                            background: "rgba(39,39,42,0.35)",
                            transition: "all 0.25s",
                        }}>
                            See Features
                        </a>
                    </div>

                    <p style={{ fontSize: 13, color: "#52525b" }}>
                        325+ hackathons indexed · 5 platforms · Real-time ingestion
                    </p>
                </FadeSection>

                <FadeSection delay={0.5} className="w-full" style={{ marginTop: 56 } as any}>
                    <DashboardMockup />
                </FadeSection>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 2: LOGO BAR                                          */}
            {/* ============================================================ */}
            <section style={{
                borderTop: "1px solid #1a1a1e",
                borderBottom: "1px solid #1a1a1e",
                padding: "40px 24px",
                background: "#0c0c0f",
            }}>
                <FadeSection className="text-center">
                    <p style={{
                        fontSize: 11,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "#52525b",
                        marginBottom: 16,
                    }}>
                        AGGREGATING FROM
                    </p>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 32,
                        flexWrap: "wrap",
                    }}>
                        {PLATFORMS.map((p) => (
                            <span
                                key={p}
                                style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#52525b",
                                    transition: "color 0.3s",
                                    cursor: "default",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
                            >
                                {p}
                            </span>
                        ))}
                    </div>
                </FadeSection>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 3: FEATURES                                          */}
            {/* ============================================================ */}
            <section id="features" style={{
                padding: "100px 24px",
                background: "linear-gradient(180deg, #0c0c0f 0%, #111114 100%)",
            }}>
                <FadeSection className="text-center" style={{ marginBottom: 64 } as any}>
                    <p style={{
                        fontSize: 11,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "#f59e0b",
                        marginBottom: 12,
                        fontWeight: 600,
                    }}>FEATURES</p>
                    <h2 style={{
                        fontSize: "clamp(28px, 4vw, 42px)",
                        fontWeight: 800,
                        color: "#fafafa",
                        letterSpacing: "-0.025em",
                        maxWidth: 700,
                        margin: "0 auto 16px",
                    }}>
                        Everything a Hacker Needs, Nothing They Don't
                    </h2>
                    <p style={{ fontSize: 16, color: "#71717a", maxWidth: 560, margin: "0 auto" }}>
                        Built by a developer who was tired of opening 5 tabs to find one good hackathon.
                    </p>
                </FadeSection>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: 20,
                    maxWidth: 1100,
                    margin: "0 auto",
                }}>
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <FadeSection key={f.title} delay={i * 0.08}>
                                <div
                                    style={{
                                        background: "rgba(24,24,27,0.7)",
                                        border: "1px solid #27272a",
                                        borderRadius: 24,
                                        padding: 28,
                                        transition: "all 0.35s ease",
                                        cursor: "default",
                                        borderBottom: "2px solid rgba(245,158,11,0.15)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 24px 56px -20px rgba(245,158,11,0.1)";
                                        e.currentTarget.style.borderColor = "#3f3f46";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                        e.currentTarget.style.borderColor = "#27272a";
                                    }}
                                >
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 14,
                                        background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(24,24,27,0.8) 100%)",
                                        border: "1px solid rgba(245,158,11,0.15)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 18,
                                    }}>
                                        <Icon className="w-5 h-5" style={{ color: "#f59e0b" }} />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
                                        {f.title}
                                    </h3>
                                    <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.65 }}>
                                        {f.desc}
                                    </p>
                                </div>
                            </FadeSection>
                        );
                    })}
                </div>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 4: HOW IT WORKS                                      */}
            {/* ============================================================ */}
            <section id="how-it-works" style={{
                padding: "100px 24px",
                background: "#09090b",
                borderTop: "1px solid #1a1a1e",
            }}>
                <FadeSection className="text-center" style={{ marginBottom: 64 } as any}>
                    <p style={{
                        fontSize: 11,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "#f59e0b",
                        marginBottom: 12,
                        fontWeight: 600,
                    }}>HOW IT WORKS</p>
                    <h2 style={{
                        fontSize: "clamp(28px, 4vw, 42px)",
                        fontWeight: 800,
                        color: "#fafafa",
                        letterSpacing: "-0.025em",
                    }}>
                        From Search to Submission in 3 Steps
                    </h2>
                </FadeSection>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 24,
                    maxWidth: 1000,
                    margin: "0 auto",
                }}>
                    {[
                        {
                            num: "01",
                            title: "Set Your Profile",
                            desc: 'Pick your skills from 10+ categories. Toggle "Tailor to my skills" on. Your profile saves automatically — no account needed.',
                            chips: ["AI/ML", "Frontend", "Backend", "Cloud", "Design", "Web3"],
                        },
                        {
                            num: "02",
                            title: "Discover & Filter",
                            desc: 'Browse 325+ hackathons with 8 filter dimensions. Use the ⌘K command palette for natural language shortcuts like "Web3 near Delhi this week".',
                            query: "AI near Delhi this week",
                        },
                        {
                            num: "03",
                            title: "Generate & Go",
                            desc: "Hit Copilot on any card. Medo generates your project title, architecture, build plan, judging strategy, and submission checklist in under 10 seconds.",
                            copilot: true,
                        },
                    ].map((step, i) => (
                        <FadeSection key={step.num} delay={i * 0.12}>
                            <div style={{
                                background: "#111114",
                                border: "1px solid #27272a",
                                borderRadius: 24,
                                padding: 28,
                                position: "relative",
                                overflow: "hidden",
                                height: "100%",
                            }}>
                                {/* Watermark number */}
                                <div style={{
                                    position: "absolute",
                                    top: -8,
                                    right: 12,
                                    fontSize: 96,
                                    fontWeight: 900,
                                    color: "rgba(245,158,11,0.05)",
                                    lineHeight: 1,
                                    pointerEvents: "none",
                                }}>{step.num}</div>

                                <div style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#f59e0b",
                                    marginBottom: 12,
                                    letterSpacing: "0.08em",
                                }}>STEP {step.num}</div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fafafa", marginBottom: 10 }}>
                                    {step.title}
                                </h3>
                                <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.65, marginBottom: 20 }}>
                                    {step.desc}
                                </p>

                                {/* Mini illustration */}
                                <div style={{
                                    background: "#18181b",
                                    border: "1px solid #27272a",
                                    borderRadius: 14,
                                    padding: 14,
                                }}>
                                    {step.chips && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {step.chips.map((c, ci) => (
                                                <div key={c} style={{
                                                    padding: "4px 10px",
                                                    borderRadius: 999,
                                                    fontSize: 11,
                                                    fontWeight: ci < 2 ? 600 : 400,
                                                    background: ci < 2 ? "#f59e0b" : "#27272a",
                                                    color: ci < 2 ? "#18181b" : "#71717a",
                                                    border: `1px solid ${ci < 2 ? "#f59e0b" : "#3f3f46"}`,
                                                }}>{c}</div>
                                            ))}
                                        </div>
                                    )}
                                    {step.query && (
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            background: "#27272a",
                                            borderRadius: 10,
                                            padding: "8px 12px",
                                        }}>
                                            <Search className="w-3.5 h-3.5" style={{ color: "#52525b" }} />
                                            <span style={{ fontSize: 12, color: "#d4d4d8" }}>{step.query}</span>
                                            <div style={{
                                                marginLeft: "auto",
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                background: "#3f3f46",
                                                fontSize: 9,
                                                color: "#a1a1aa",
                                                fontFamily: "monospace",
                                            }}>⌘K</div>
                                        </div>
                                    )}
                                    {step.copilot && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase" }}>PITCH</div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: "#fafafa" }}>EcoTrack: Carbon Analyzer</div>
                                            <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>ARCHITECTURE</div>
                                            <div style={{ fontSize: 10, color: "#a1a1aa" }}>• React + TypeScript frontend</div>
                                            <div style={{ fontSize: 10, color: "#a1a1aa" }}>• Express API layer</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FadeSection>
                    ))}
                </div>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 5: COPILOT SPOTLIGHT                                 */}
            {/* ============================================================ */}
            <section style={{
                padding: "100px 24px",
                background: "linear-gradient(180deg, #111114 0%, #0c0c0f 100%)",
                borderTop: "1px solid #1a1a1e",
            }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                    gap: 48,
                    maxWidth: 1050,
                    margin: "0 auto",
                    alignItems: "center",
                }}>
                    <FadeSection>
                        <p style={{
                            fontSize: 11,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "#f59e0b",
                            marginBottom: 12,
                            fontWeight: 600,
                        }}>POWERED BY MEDO</p>
                        <h2 style={{
                            fontSize: "clamp(26px, 3.5vw, 38px)",
                            fontWeight: 800,
                            color: "#fafafa",
                            letterSpacing: "-0.025em",
                            marginBottom: 16,
                        }}>
                            Your AI Hackathon Strategist
                        </h2>
                        <p style={{ fontSize: 15, color: "#71717a", lineHeight: 1.7, marginBottom: 28 }}>
                            Every hackathon gets a personalized, execution-ready project plan. Not just
                            ideas — a complete strategy mapped to judging criteria.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                            {[
                                "Project title + one-line pitch",
                                "Architecture and build plan",
                                "Judging alignment for all 5 criteria",
                                "Submission kit with demo script",
                                "Risk mitigation strategies",
                            ].map((item) => (
                                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 6,
                                        background: "rgba(245,158,11,0.12)",
                                        border: "1px solid rgba(245,158,11,0.2)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <Check className="w-3 h-3" style={{ color: "#f59e0b" }} />
                                    </div>
                                    <span style={{ fontSize: 14, color: "#d4d4d8" }}>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            display: "inline-flex",
                            padding: "6px 14px",
                            borderRadius: 999,
                            border: "1px solid #27272a",
                            fontSize: 11,
                            color: "#71717a",
                            background: "#111114",
                        }}>
                            Deterministic fallback on API failure — never leaves you blank
                        </div>
                    </FadeSection>

                    <FadeSection delay={0.15}>
                        <div style={{
                            background: "#18181b",
                            border: "1px solid #27272a",
                            borderTop: "2px solid rgba(245,158,11,0.3)",
                            borderRadius: 24,
                            padding: 24,
                            boxShadow: "0 24px 56px -20px rgba(0,0,0,0.5)",
                            transform: "rotate(1deg)",
                        }}>
                            <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>PITCH</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>EcoTrack: Carbon Footprint Analyzer</div>
                            <div style={{ fontSize: 13, color: "#71717a", marginBottom: 20 }}>Track, analyze, and reduce your carbon footprint with AI-powered insights</div>

                            <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>ARCHITECTURE</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
                                {["React frontend with TypeScript", "Node.js backend with Express", "PostgreSQL database"].map((a) => (
                                    <div key={a} style={{ fontSize: 12, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 4, height: 4, borderRadius: 2, background: "#52525b" }} />
                                        {a}
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>JUDGING ALIGNMENT</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[
                                    { label: "Execution", value: "MVP + demo ready" },
                                    { label: "Impact", value: "Climate action focus" },
                                    { label: "Creativity", value: "AI + sustainability" },
                                    { label: "Design", value: "Clean data viz" },
                                ].map((j) => (
                                    <div key={j.label} style={{
                                        background: "#27272a",
                                        borderRadius: 10,
                                        padding: "8px 10px",
                                    }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#d4d4d8", marginBottom: 2 }}>{j.label}</div>
                                        <div style={{ fontSize: 11, color: "#71717a" }}>{j.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeSection>
                </div>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 6: COMPARISON TABLE                                  */}
            {/* ============================================================ */}
            <section id="compare" style={{
                padding: "100px 24px",
                background: "#09090b",
                borderTop: "1px solid #1a1a1e",
            }}>
                <FadeSection className="text-center" style={{ marginBottom: 48 } as any}>
                    <h2 style={{
                        fontSize: "clamp(26px, 3.5vw, 38px)",
                        fontWeight: 800,
                        color: "#fafafa",
                        letterSpacing: "-0.025em",
                        marginBottom: 12,
                    }}>
                        Why Not Just Use Devpost?
                    </h2>
                    <p style={{ fontSize: 15, color: "#71717a" }}>
                        Here's what you'd need 5 browser tabs and 30 minutes to do manually.
                    </p>
                </FadeSection>

                <FadeSection delay={0.1}>
                    <div style={{
                        maxWidth: 900,
                        margin: "0 auto",
                        borderRadius: 24,
                        border: "1px solid #27272a",
                        overflow: "hidden",
                        boxShadow: "0 16px 48px -20px rgba(0,0,0,0.5)",
                    }}>
                        {/* Table header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1fr",
                            background: "#18181b",
                            borderBottom: "1px solid #27272a",
                        }}>
                            {["Feature", "HackHunt", "Devpost", "Devfolio", "MLH"].map((h, i) => (
                                <div key={h} style={{
                                    padding: "14px 16px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: i === 1 ? "#18181b" : "#a1a1aa",
                                    background: i === 1 ? "#f59e0b" : "transparent",
                                    textAlign: i === 0 ? "left" : "center",
                                    letterSpacing: i === 0 ? "0.04em" : 0,
                                }}>{h}</div>
                            ))}
                        </div>

                        {/* Table rows */}
                        {COMPARISON_ROWS.map((row, ri) => (
                            <div
                                key={row.feature}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1fr",
                                    borderBottom: ri < COMPARISON_ROWS.length - 1 ? "1px solid #1a1a1e" : "none",
                                    background: ri % 2 === 0 ? "#0c0c0f" : "#111114",
                                }}
                            >
                                <div style={{ padding: "14px 16px", fontSize: 13, color: "#d4d4d8", fontWeight: 500 }}>
                                    {row.feature}
                                </div>
                                <div style={{
                                    padding: "14px 16px",
                                    textAlign: "center",
                                    background: "rgba(245,158,11,0.04)",
                                }}>
                                    <CompCell value={row.hh} isHH />
                                </div>
                                <div style={{ padding: "14px 16px", textAlign: "center" }}>
                                    <CompCell value={row.dp} />
                                </div>
                                <div style={{ padding: "14px 16px", textAlign: "center" }}>
                                    <CompCell value={row.df} />
                                </div>
                                <div style={{ padding: "14px 16px", textAlign: "center" }}>
                                    <CompCell value={row.mlh} />
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeSection>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 7: TESTIMONIAL                                       */}
            {/* ============================================================ */}
            <section style={{
                padding: "100px 24px",
                background: "#111114",
                borderTop: "1px solid #1a1a1e",
                position: "relative",
            }}>
                <FadeSection className="text-center" style={{ position: "relative" } as any}>
                    {/* Decorative quote marks */}
                    <div style={{
                        fontSize: 180,
                        fontFamily: "Georgia, serif",
                        color: "rgba(245,158,11,0.08)",
                        lineHeight: 0.6,
                        marginBottom: -40,
                        userSelect: "none",
                    }}>"</div>

                    <blockquote style={{
                        fontSize: "clamp(18px, 2.5vw, 24px)",
                        color: "#e4e4e7",
                        lineHeight: 1.6,
                        fontWeight: 500,
                        maxWidth: 700,
                        margin: "0 auto 24px",
                        fontStyle: "italic",
                    }}>
                        I used to spend 45 minutes every weekend hunting for hackathons across 5 sites.
                        Now I open HackHunt, press ⌘K, type 'AI near Delhi this weekend', and I'm
                        done in 10 seconds.
                    </blockquote>

                    {/* Decorative line */}
                    <div style={{
                        width: 60,
                        height: 2,
                        background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)",
                        margin: "0 auto 16px",
                    }} />

                    <p style={{ fontSize: 13, color: "#52525b" }}>
                        — Built by a developer, for developers
                    </p>
                </FadeSection>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 8: STATS                                             */}
            {/* ============================================================ */}
            <section style={{
                padding: "64px 24px",
                background: "#09090b",
                borderTop: "1px solid #1a1a1e",
                borderBottom: "1px solid #1a1a1e",
            }}>
                <div ref={statsSection.ref} style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 0,
                    maxWidth: 900,
                    margin: "0 auto",
                }}>
                    {[
                        { value: hackathonCount, suffix: "+", label: "Hackathons Indexed" },
                        { value: platformCount, suffix: "", label: "Platforms Integrated" },
                        { value: cityCount, suffix: "", label: "Cities with Location Filter" },
                        { value: null, display: "< 10s", label: "Copilot Generation Time" },
                    ].map((stat, i) => (
                        <div key={stat.label} style={{
                            textAlign: "center",
                            padding: "20px 16px",
                            borderRight: i < 3 ? "1px solid #1a1a1e" : "none",
                            borderTop: "2px solid rgba(245,158,11,0.15)",
                        }}>
                            <div style={{
                                fontSize: "clamp(32px, 4vw, 48px)",
                                fontWeight: 800,
                                color: "#f59e0b",
                                lineHeight: 1,
                                marginBottom: 8,
                            }}>
                                {stat.value !== null ? `${stat.value}${stat.suffix}` : stat.display}
                            </div>
                            <div style={{ fontSize: 13, color: "#52525b", fontWeight: 500 }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 9: FINAL CTA                                         */}
            {/* ============================================================ */}
            <section style={{
                padding: "120px 24px",
                background: "#09090b",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Amber glow */}
                <div style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 600,
                    height: 400,
                    background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <FadeSection className="text-center" style={{ position: "relative", zIndex: 1 } as any}>
                    <h2 style={{
                        fontSize: "clamp(28px, 5vw, 52px)",
                        fontWeight: 800,
                        color: "#fafafa",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        maxWidth: 650,
                        margin: "0 auto 20px",
                    }}>
                        Your Next Hackathon Win Starts Here
                    </h2>
                    <p style={{ fontSize: 17, color: "#71717a", marginBottom: 36 }}>
                        No signup. No paywall. Just open and start hunting.
                    </p>
                    <Link to="/app" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#f59e0b",
                        color: "#18181b",
                        fontSize: 18,
                        fontWeight: 700,
                        padding: "16px 40px",
                        borderRadius: 14,
                        textDecoration: "none",
                        boxShadow: "0 8px 32px -8px rgba(245,158,11,0.4)",
                        transition: "all 0.25s",
                    }}>
                        Launch HackHunt <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p style={{ fontSize: 12, color: "#3f3f46", marginTop: 16 }}>
                        Free forever · Open source · No signup
                    </p>
                </FadeSection>
            </section>

            {/* ============================================================ */}
            {/*  SECTION 10: FOOTER                                           */}
            {/* ============================================================ */}
            <footer style={{
                padding: "40px 32px",
                background: "#09090b",
                borderTop: "1px solid #1a1a1e",
            }}>
                <div style={{
                    maxWidth: 1100,
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#d4d4d8" }}>HackHunt</div>
                        <div style={{ fontSize: 12, color: "#3f3f46", marginTop: 4 }}>Built for LovHack × Medo 2026</div>
                    </div>
                    <div style={{ display: "flex", gap: 24 }}>
                        {["GitHub", "Product Hunt", "Twitter"].map((link) => (
                            <a
                                key={link}
                                href="#"
                                style={{
                                    fontSize: 13,
                                    color: "#52525b",
                                    textDecoration: "none",
                                    transition: "color 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
                <div style={{
                    textAlign: "center",
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: "1px solid #1a1a1e",
                    fontSize: 11,
                    color: "#27272a",
                }}>
                    © 2026 HackHunt. Built with obsessive attention to detail.
                </div>
            </footer>

            {/* ============================================================ */}
            {/*  RESPONSIVE STYLES (injected)                                 */}
            {/* ============================================================ */}
            <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mockup-container > div { 
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .mockup-container > div > div:first-child {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
        </div>
    );
}

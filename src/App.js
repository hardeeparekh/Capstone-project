import "./App.css";
import { useEffect, useRef, useState } from "react";
import BackgroundEffects from "./components/BackgroundEffects";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import GallerySection from "./components/GallerySection";
import TimelineSection from "./components/TimelineSection";
import LevelsSection from "./components/LevelsSection";
import MathSection from "./components/MathSection";
import CTASection from "./components/CTASection";
import SiteFooter from "./components/SiteFooter";
import AuthPage from "./components/AuthPage";
import ProfilePage from "./components/ProfilePage";

const API_BASE = "http://localhost:5000/api";

function App() {
  const [isAltMode, setIsAltMode] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [pageProgress, setPageProgress] = useState(0);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const timelineRef = useRef(null);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const restoreSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("access_token");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("access_token");
      }
    };

    restoreSession();
  }, []);

  const handleAuthSubmit = async (mode, payload) => {
    const endpoint = mode === "login" ? `${API_BASE}/auth/login` : `${API_BASE}/auth/signup`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Authentication failed");

    if (result.token) localStorage.setItem("access_token", result.token);
    setUser(result.data.user);
    setIsAuthOpen(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        });
      }
    } catch (error) { console.log(error); }
    localStorage.removeItem("access_token");
    setUser(null);
    navigate("/");
  };

  useEffect(() => {
    document.body.classList.toggle("alt", isAltMode);
    return () => document.body.classList.remove("alt");
  }, [isAltMode]);

  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll(".reveal"));
    revealNodes.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 60, 260)}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    revealNodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [currentPath]);

  useEffect(() => {
    let rafId = null;
    const updateProgress = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setPageProgress(maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0);

      if (timelineRef.current && currentPath === "/") {
        const rect = timelineRef.current.getBoundingClientRect();
        const viewport = window.innerHeight;
        const start = viewport * 0.8;
        const end = -rect.height + viewport * 0.2;
        const val = (start - rect.top) / (start - end);
        setTimelineProgress(Math.max(0, Math.min(1, val)) * 100);
      }
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateProgress();
        rafId = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentPath]);

  return (
    <>
      <BackgroundEffects />
      <Navbar
        pageProgress={pageProgress}
        isAltMode={isAltMode}
        onToggleMode={() => setIsAltMode((prev) => !prev)}
        onOpenAuth={() => user ? navigate("/profile") : setIsAuthOpen(true)}
        onGoHome={() => navigate("/")}
        user={user}
        isProfileActive={currentPath === "/profile"}
      />

      <main>
        {currentPath === "/profile" && user ? (
          <ProfilePage
            user={user}
            onLogout={handleLogout}
            onClose={() => navigate("/")}
          />
        ) : (
          <>
            <HeroSection />
            <GallerySection />
            <TimelineSection
              timelineRef={timelineRef}
              timelineProgress={timelineProgress}
            />
            <LevelsSection />
            <MathSection />
            <CTASection />
          </>
        )}
      </main>

      <SiteFooter />

      {isAuthOpen && (
        <AuthPage
          onClose={() => setIsAuthOpen(false)}
          onAuthSubmit={handleAuthSubmit}
        />
      )}
    </>
  );
}

export default App;
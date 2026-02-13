import './App.css';
import { useEffect, useRef, useState } from 'react';
import BackgroundEffects from './components/BackgroundEffects';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import GallerySection from './components/GallerySection';
import TimelineSection from './components/TimelineSection';
import LevelsSection from './components/LevelsSection';
import MathSection from './components/MathSection';
import CTASection from './components/CTASection';
import SiteFooter from './components/SiteFooter';

function App() {
  const [isAltMode, setIsAltMode] = useState(false);
  const [pageProgress, setPageProgress] = useState(0);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const timelineRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('alt', isAltMode);
    return () => {
      document.body.classList.remove('alt');
    };
  }, [isAltMode]);

  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll('.reveal'));
    revealNodes.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 60, 260)}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealNodes.forEach((el) => observer.observe(el));

    return () => {
      revealNodes.forEach((el) => {
        el.style.transitionDelay = '';
      });
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const tiltCards = Array.from(document.querySelectorAll('.tilt'));
    const cleanupFns = [];

    tiltCards.forEach((card) => {
      const handleMouseMove = (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateX = ((y / rect.height) - 0.5) * -5;
        const rotateY = ((x / rect.width) - 0.5) * 7;

        card.style.transform =
          `perspective(700px) translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      };

      const handleMouseLeave = () => {
        card.style.transform = '';
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);

      cleanupFns.push(() => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.style.transform = '';
      });
    });

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    let rafId = null;
    const timelineNodes = Array.from(document.querySelectorAll('.feature-node'));
    let activeTimelineNode = null;

    const updateActiveTimelineStep = () => {
      if (!timelineNodes.length) {
        return;
      }

      const targetY = window.innerHeight * 0.5;
      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      timelineNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const distance = Math.abs(centerY - targetY);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = node;
        }
      });

      if (activeTimelineNode !== nearest) {
        activeTimelineNode?.classList.remove('active-step');
        nearest?.classList.add('active-step');
        activeTimelineNode = nearest;
      }
    };

    const updateProgress = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const percent = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
      setPageProgress(Math.max(0, Math.min(100, percent)));

      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const viewport = window.innerHeight || document.documentElement.clientHeight;
        const start = viewport * 0.8;
        const end = -rect.height + viewport * 0.2;
        const val = (start - rect.top) / (start - end);
        const timelinePercent = Math.max(0, Math.min(1, val)) * 100;
        setTimelineProgress(timelinePercent);
      }

      updateActiveTimelineStep();
    };

    const onScroll = () => {
      if (rafId !== null) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        updateProgress();
        rafId = null;
      });
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      activeTimelineNode?.classList.remove('active-step');
    };
  }, []);

  return (
    <>
      <BackgroundEffects />
      <Navbar
        pageProgress={pageProgress}
        isAltMode={isAltMode}
        onToggleMode={() => setIsAltMode((prev) => !prev)}
      />
      <main>
        <HeroSection />
        <GallerySection />
        <TimelineSection timelineRef={timelineRef} timelineProgress={timelineProgress} />
        <LevelsSection />
        <MathSection />
        <CTASection />
      </main>
      <SiteFooter />
    </>
  );
}

export default App;

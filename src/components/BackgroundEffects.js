import { useEffect, useRef, useState } from 'react';

const TERMS = [
  'Rs 1,20,000',
  'Rs +8,500',
  'Rs -3,200',
  '+12% ROI',
  'SIP +Rs 2,000',
  'Div Reinvested',
  'Market Crash',
  'Inflation +2%',
  'Emergency Fund +Rs 15,000',
  'Market Dip -4.2%',
];

function classifyFloater(text) {
  if (text.includes('+')) {
    return 'up';
  }
  if (text.includes('-') || text.includes('Crash')) {
    return 'down';
  }
  return 'neutral';
}

export default function BackgroundEffects() {
  const [floaters, setFloaters] = useState([]);
  const timeoutIds = useRef([]);

  useEffect(() => {
    const spawnFloater = () => {
      const text = TERMS[Math.floor(Math.random() * TERMS.length)];
      const id = `${Date.now()}-${Math.random()}`;
      const next = {
        id,
        text,
        left: `${Math.random() * 90}vw`,
        tone: classifyFloater(text),
        duration: `${6 + Math.random() * 4}s`,
      };

      setFloaters((prev) => [...prev, next]);

      const timeoutId = window.setTimeout(() => {
        setFloaters((prev) => prev.filter((item) => item.id !== id));
      }, 8000);

      timeoutIds.current.push(timeoutId);
    };

    spawnFloater();
    spawnFloater();
    const intervalId = window.setInterval(spawnFloater, 1400);

    return () => {
      window.clearInterval(intervalId);
      timeoutIds.current.forEach((id) => window.clearTimeout(id));
      timeoutIds.current = [];
    };
  }, []);

  return (
    <>
      <div className="data-floaters" aria-hidden="true">
        {floaters.map((floater) => (
          <div
            key={floater.id}
            className={`floater ${floater.tone}`}
            style={{ left: floater.left, animationDuration: floater.duration }}
          >
            {floater.text}
          </div>
        ))}
      </div>
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-orb orb-c" />
      <div className="noise" />
    </>
  );
}

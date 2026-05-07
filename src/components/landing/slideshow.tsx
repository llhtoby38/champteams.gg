'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export type Slide = {
  src: string;
  alt: string;
  caption: string;
  mobile?: boolean; // true = display as phone mockup
};

type SlideshowProps = {
  slides: Slide[];
  interval?: number; // ms between slides
  accentColor?: string;
};

export function Slideshow({ slides, interval = 4500, accentColor = '#d4a017' }: SlideshowProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [paused, next, interval]);

  const hasMobile = slides.some((s) => s.mobile);

  return (
    <div
      className="flex flex-col gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Image container */}
      <div
        style={{
          position: 'relative',
          borderRadius: hasMobile ? undefined : '6px',
          overflow: hasMobile ? 'visible' : 'hidden',
          background: hasMobile ? 'transparent' : '#1a1a2e',
          border: hasMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: hasMobile ? 'none' : '0 8px 40px rgba(0,0,0,0.35)',
        }}
      >
        {slides.map((slide, i) =>
          slide.mobile ? (
            /* Phone mockup — all slides stacked, crossfade via opacity */
            <div
              key={slide.src}
              style={{
                ...(i === 0
                  ? { position: 'relative' as const }
                  : { position: 'absolute' as const, inset: 0 }),
                opacity: i === active ? 1 : 0,
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: i === active ? 'auto' : 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '280px',
                  maxWidth: '80vw',
                  borderRadius: '24px',
                  border: '5px solid #2a2a3e',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
                  background: '#2a2a3e',
                  overflow: 'hidden',
                }}
              >
                <div style={{ borderRadius: '19px', overflow: 'hidden' }}>
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={1206}
                    height={2622}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              key={slide.src}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                inset: i === 0 ? undefined : 0,
                opacity: i === active ? 1 : 0,
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: i === active ? 'auto' : 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                width={2000}
                height={1010}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority={i === 0}
              />
            </div>
          )
        )}

        {/* Nav arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous slide"
              style={{
                position: 'absolute',
                left: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(26,26,46,0.7)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                zIndex: 2,
                opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            >
              &#8249;
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(26,26,46,0.7)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                zIndex: 2,
                opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            >
              &#8250;
            </button>
          </>
        )}
      </div>

      {/* Caption + dot indicators */}
      <div className="flex flex-col items-center gap-2">
        <p
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            textAlign: 'center',
            minHeight: '1.5em',
            transition: 'opacity 0.3s',
          }}
        >
          {slides[active].caption}
        </p>
        {slides.length > 1 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: i === active ? '20px' : '7px',
                  height: '7px',
                  borderRadius: '4px',
                  background: i === active ? accentColor : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

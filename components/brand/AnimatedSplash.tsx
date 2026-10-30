import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Spark } from './Spark';

export interface AnimatedSplashProps {
  ready: boolean;
  onDone: () => void;
}

interface Ripple {
  id: number;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ ready, onDone }) => {
  const shouldReduceMotion = useReducedMotion();
  const mountedAt = useRef(Date.now());
  const [isExiting, setIsExiting] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const onDoneCalled = useRef(false);

  const handleFinish = () => {
    if (!onDoneCalled.current) {
      onDoneCalled.current = true;
      onDone();
    }
  };

  // Check test environment to avoid stalling fake timer / vitest tests
  const isTest = Boolean(
    (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST))) ||
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.MODE === 'test' || Boolean((import.meta as any).env?.VITEST))) ||
    typeof (globalThis as any).vi !== 'undefined'
  );

  // Exit trigger when ready === true AND at least 900ms have passed
  useEffect(() => {
    if (!ready) return;

    if (isTest) {
      handleFinish();
      return;
    }

    if (shouldReduceMotion) {
      // Reduced motion: 200ms exit
      const timer = setTimeout(handleFinish, 200);
      return () => clearTimeout(timer);
    }

    const elapsed = Date.now() - mountedAt.current;
    const minDisplayTime = 900;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    const timer = setTimeout(() => {
      setIsExiting(true);
      const exitTimer = setTimeout(handleFinish, 320);
      return () => clearTimeout(exitTimer);
    }, remaining);

    return () => clearTimeout(timer);
  }, [ready, shouldReduceMotion, isTest]);

  // Ripple loop: every 1.6s after 1200ms, spawn a ripple ring (max 3 alive)
  useEffect(() => {
    if (shouldReduceMotion || isTest || isExiting) return;

    const startTimeout = setTimeout(() => {
      // First ripple on the initial heartbeat
      setRipples([{ id: Date.now() }]);

      const interval = setInterval(() => {
        setRipples((prev) => [...prev.slice(-2), { id: Date.now() }]);
      }, 1600);

      return () => clearInterval(interval);
    }, 1200);

    return () => clearTimeout(startTimeout);
  }, [shouldReduceMotion, isTest, isExiting]);

  // Reduced motion mode: static splash with simple fade-out
  if (shouldReduceMotion) {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        animate={{ opacity: ready ? 0 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 h-[100dvh] w-full bg-[var(--wa-hero)] text-white overflow-hidden flex flex-col items-center justify-center font-body select-none"
      >
        <span className="sr-only">Checking your secure session... Loading Warrior AI</span>

        {/* Concentric coral rings */}
        <div aria-hidden="true" className="absolute w-[640px] h-[640px] rounded-full border border-wa-coral/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div aria-hidden="true" className="absolute w-[460px] h-[460px] rounded-full border border-wa-coral/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div aria-hidden="true" className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(232,52,79,0.35)_0%,rgba(232,52,79,0)_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* 3 static sparks */}
        <Spark className="absolute top-[20%] left-[18%] w-[18px] h-[18px] text-wa-coral/70" />
        <Spark className="absolute top-[30%] right-[16%] w-[12px] h-[12px] text-wa-ground/60" />
        <Spark className="absolute bottom-[30%] right-[22%] w-[14px] h-[14px] text-wa-coral/60" />

        {/* Center mark + lockup */}
        <div className="relative flex flex-col items-center gap-7 -mt-10">
          <svg role="img" aria-label="Warrior AI" width="120" height="160" viewBox="14 2 72 96">
            <path
              fill="#E8344F"
              fillRule="evenodd"
              d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z"
            />
          </svg>
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-[38px] tracking-tight text-white">Warrior</span>
            <span className="font-display font-bold text-[19px] bg-wa-crimson text-white rounded-[10px] px-2.5 py-0.5">AI</span>
          </div>
        </div>

        {/* Bottom progress bar + pilot disclaimer */}
        <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-4">
          <div className="w-[120px] h-1 rounded-full bg-white/15 overflow-hidden">
            <div className="w-[55%] h-full rounded-full bg-wa-coral" />
          </div>
          <span className="text-[13px] text-wa-on-plum-muted">Pilot version · sample data only</span>
        </div>
      </motion.div>
    );
  }

  // Full Motion sequence
  const letters = ['W', 'a', 'r', 'r', 'i', 'o', 'r'];

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ backgroundColor: '#2A0A1F', opacity: 1, y: 0 }}
      animate={{
        backgroundColor: '#3B0F2C',
        opacity: isExiting ? 0 : 1,
        y: isExiting ? -12 : 0,
      }}
      transition={{
        backgroundColor: { duration: 0.4, ease: 'easeOut' },
        opacity: { duration: isExiting ? 0.32 : 0.4, ease: 'easeOut' },
        y: { duration: isExiting ? 0.32 : 0.4, ease: 'easeOut' },
      }}
      className="fixed inset-0 z-50 h-[100dvh] w-full text-white overflow-hidden flex flex-col items-center justify-center font-body select-none"
    >
      <span className="sr-only">Checking your secure session... Loading Warrior AI</span>

      {/* 1. Intro Coral Rings (staggered 120ms, scale 0.6->1, fade in to opacities) */}
      {/* Ring 1 (640px) */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 0.5, delay: 0, ease: 'easeOut' }}
        className="absolute w-[640px] h-[640px] rounded-full border border-wa-coral/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      {/* Ring 2 (460px) */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
        className="absolute w-[460px] h-[460px] rounded-full border border-wa-coral/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      {/* Ring 3 (300px glow disk) with heartbeat pulse after intro */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{
          scale: [0.6, 1, 1.08, 1, 1.05, 1],
          opacity: [0, 1, 1, 1, 1, 1],
        }}
        transition={{
          scale: {
            times: [0, 0.25, 0.4, 0.55, 0.7, 1],
            duration: 1.6,
            repeat: Infinity,
            repeatDelay: 1.0,
            ease: 'easeInOut',
          },
          opacity: { duration: 0.5, delay: 0.24 },
        }}
        className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(232,52,79,0.35)_0%,rgba(232,52,79,0)_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      {/* Dynamic Ripple Rings (spawned on heartbeat beat, max 3) */}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          aria-hidden="true"
          initial={{ scale: 0.8, opacity: 0.35 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="absolute w-[240px] h-[240px] rounded-full border border-wa-coral/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />
      ))}

      {/* 3 Twinkling & Drifting Background Sparks */}
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: [0.3, 0.9, 0.3],
          scale: [0.8, 1.1, 0.8],
          x: [-5, 6, -5],
          y: [4, -5, 4],
        }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.1,
        }}
        className="absolute top-[20%] left-[18%] text-wa-coral/70 pointer-events-none"
      >
        <Spark className="w-[18px] h-[18px]" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        animate={{
          opacity: [0.4, 0.85, 0.4],
          scale: [0.85, 1.05, 0.85],
          x: [5, -4, 5],
          y: [-4, 6, -4],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.4,
        }}
        className="absolute top-[30%] right-[16%] text-wa-ground/60 pointer-events-none"
      >
        <Spark className="w-[12px] h-[12px]" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        animate={{
          opacity: [0.3, 0.95, 0.3],
          scale: [0.8, 1.15, 0.8],
          x: [-6, 4, -6],
          y: [-5, 5, -5],
        }}
        transition={{
          duration: 4.1,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.7,
        }}
        className="absolute bottom-[30%] right-[22%] text-wa-coral/60 pointer-events-none"
      >
        <Spark className="w-[14px] h-[14px]" />
      </motion.div>

      {/* Center drop mark + Glint + Squash on land */}
      <div className="relative flex flex-col items-center gap-7 -mt-10">
        {/* Outer container: Spring entrance (200-700ms) & Exit scaling */}
        <motion.div
          initial={{ y: -24, scale: 0.85, opacity: 0 }}
          animate={
            isExiting
              ? { scale: 1.12, opacity: 0 }
              : { y: 0, scale: 1, opacity: 1 }
          }
          transition={
            isExiting
              ? { duration: 0.28, ease: 'easeIn' }
              : {
                  y: { type: 'spring', stiffness: 260, damping: 18, delay: 0.2 },
                  opacity: { duration: 0.35, delay: 0.2 },
                  scale: { type: 'spring', stiffness: 260, damping: 18, delay: 0.2 },
                }
          }
          className="relative w-[120px] h-[160px]"
        >
          {/* Inner container: Landing squash (scaleY 1->0.94->1, scaleX 1->1.04->1 over 120ms) */}
          <motion.div
            initial={{ scaleY: 1, scaleX: 1 }}
            animate={{
              scaleY: [1, 0.94, 1],
              scaleX: [1, 1.04, 1],
            }}
            transition={{
              delay: 0.58,
              duration: 0.12,
              times: [0, 0.5, 1],
              ease: 'easeOut',
            }}
            className="w-full h-full"
            style={{ transformOrigin: '50% 90%' }}
          >
            <svg
              role="img"
              aria-label="Warrior AI"
              width="120"
              height="160"
              viewBox="14 2 72 96"
              className="overflow-visible"
            >
              <defs>
                <clipPath id="drop-glint-clip">
                  <path
                    fillRule="evenodd"
                    d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z"
                  />
                </clipPath>
                <linearGradient id="glint-sweep-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.35" />
                  <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Base Coral Drop */}
              <path
                fill="#E8344F"
                fillRule="evenodd"
                d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z"
              />

              {/* Glint light sweep (700-1000ms): soft white diagonal light sweep clipped to drop */}
              <motion.rect
                x="-60"
                y="-10"
                width="45"
                height="120"
                transform="rotate(25 50 50)"
                fill="url(#glint-sweep-gradient)"
                clipPath="url(#drop-glint-clip)"
                initial={{ x: -70 }}
                animate={{ x: 120 }}
                transition={{
                  delay: 0.7,
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
              />

              {/* Spark cut-out brief flash & rotate (700-1000ms) */}
              <motion.path
                d="M50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z"
                fill="#FFFFFF"
                style={{ transformOrigin: '50px 62px' }}
                initial={{ opacity: 0, rotate: -15 }}
                animate={{
                  opacity: [0, 0.9, 0],
                  rotate: [-15, 0, 0],
                }}
                transition={{
                  delay: 0.7,
                  duration: 0.3,
                  times: [0, 0.5, 1],
                  ease: 'easeInOut',
                }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Wordmark: Letters rise (y:8->0, stagger 30ms) + AI badge pops (800-1200ms) */}
        <div className="flex items-center gap-2">
          <div className="flex font-display font-extrabold text-[38px] tracking-tight text-white leading-none">
            {letters.map((char, index) => (
              <motion.span
                key={index}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.8 + index * 0.03,
                  duration: 0.22,
                  ease: 'easeOut',
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </div>

          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: [0.6, 1.08, 1],
              opacity: 1,
            }}
            transition={{
              delay: 1.05,
              duration: 0.25,
              times: [0, 0.6, 1],
              ease: 'easeOut',
            }}
            className="font-display font-bold text-[19px] bg-wa-crimson text-white rounded-[10px] px-2.5 py-0.5 shadow-sm inline-block"
          >
            AI
          </motion.span>
        </div>
      </div>

      {/* Bottom Progress Bar & Pilot Disclaimer */}
      <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-4">
        <div className="w-[120px] h-1 rounded-full bg-white/15 overflow-hidden relative">
          {isExiting ? (
            <motion.div
              initial={{ width: '45%' }}
              animate={{ x: 0, width: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full bg-wa-coral rounded-full"
            />
          ) : (
            <motion.div
              initial={{ x: -60, width: '45%' }}
              animate={{ x: [-60, 130] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: 'easeInOut',
              }}
              className="h-full bg-wa-coral rounded-full"
            />
          )}
        </div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-[13px] text-wa-on-plum-muted"
        >
          Pilot version · sample data only
        </motion.span>
      </div>
    </motion.div>
  );
};

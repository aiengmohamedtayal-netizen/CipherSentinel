import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronDown, ShieldCheck, Lock } from 'lucide-react';
import beesVideo from '../assets/images/gorgeous-bees.webm';

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented
        });
      }
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const handleScrollToNext = () => {
    const nextSection = document.getElementById('overview-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={containerRef}
      id="hero-section"
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden px-4 sm:px-8 lg:px-12 text-center bg-[#1F2B1D]"
    >
      {/* Background Video with Rich Dark Overlay */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        src={beesVideo}
        className="absolute inset-0 w-full h-full object-cover z-0 filter blur-[1px] opacity-40 scale-105"
      >
        <source src={beesVideo} type="video/webm" />
      </video>

      {/* Deep Botanical Slate Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1F2B1D]/80 via-[#1F2B1D]/70 to-[#1F2B1D] pointer-events-none z-10" />

      {/* Decorative Subtle Geometric Cryptographic Watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD7C7_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none z-10" />

      {/* Foreground Content in Sandstone Color */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-20 max-w-5xl mx-auto w-full flex flex-col items-center justify-center space-y-6 sm:space-y-8 text-[#F4EFE6] drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)]"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-black/25 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-[#CBD7C7]" />
            <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#F4EFE6]">
              AI-Assisted Secure Message Protection System
            </p>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-[0.95] text-[#F4EFE6] font-normal">
            CipherSentinel
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-[#F4EFE6]/90 font-light max-w-3xl mx-auto pt-1 leading-relaxed">
            Unifying machine-learning threat classification, authenticated hybrid encryption, and cryptographic data integrity in an offline-first workbench.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3 text-xs font-mono uppercase tracking-wider text-[#CBD7C7]/80">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">AES-256-GCM</span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">RSA-3072 OAEP</span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">SHA-256 Digest</span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">TF-IDF Advisory</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll Down Hint */}
      <motion.button
        type="button"
        onClick={handleScrollToNext}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 0.6, duration: 0.8 },
          y: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
        }}
        className="absolute bottom-8 sm:bottom-12 z-20 flex flex-col items-center gap-2 text-[#F4EFE6] hover:text-white transition-colors cursor-pointer group"
      >
        <span className="text-xs font-semibold tracking-widest uppercase text-[#F4EFE6] group-hover:text-white">
          Scroll to explore workbench
        </span>
        <ChevronDown className="w-5 h-5 text-[#F4EFE6] group-hover:translate-y-0.5 transition-transform" />
      </motion.button>
    </section>
  );
};

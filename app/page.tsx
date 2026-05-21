'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Squares from '@/components/Squares';

export default function Home() {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 35, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 90,
        damping: 18,
        mass: 0.9,
      },
    },
  };

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 20,
      },
    },
  };



  return (
    <div className="min-h-screen bg-brand-cream text-zinc-900 font-sans overflow-x-hidden select-none relative">
      {/* Interactive Squares background overlay from ReactBits */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <Squares 
          direction="diagonal"
          speed={0.4}
          borderColor="rgba(0, 0, 0, 0.04)"
          hoverFillColor="rgba(168, 44, 36, 0.06)"
        />
      </div>

      {/* Dynamic diagonal paper grain pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      <div className="min-h-screen flex flex-col relative z-10">
        
        {/* ── Top Navbar ─────────────────────────────────────────────────── */}
        <motion.header 
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="bg-brand-cream/80 backdrop-blur-md border-b border-zinc-900/10 px-6 py-4 sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
            <Link 
              href="/" 
              className="flex items-center gap-1 hover:scale-[1.01] transition-transform duration-200"
            >
              <div className="flex items-center gap-0.5 font-black text-xl tracking-tight">
                <span className="text-brand-red">Resolve</span>
                <span className="text-zinc-900 font-bold">.ai</span>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-xs font-black uppercase tracking-[0.15em] text-zinc-600 hover:text-zinc-950 transition-colors duration-150"
              >
                Sign In
              </Link>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center bg-zinc-950 text-white text-xs font-black uppercase tracking-[0.15em] px-5 py-2.5 border border-zinc-950 shadow-[3px_3px_0_0_#A82C24] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#A82C24] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 ease-out"
                >
                  Launch Dashboard
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* ── Main Section ────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col justify-center px-6">
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto py-20 md:py-32 flex flex-col items-center text-center w-full"
          >
            {/* Title Header */}
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-zinc-950"
            >
              Resolve Your Queries
              <br />
              <motion.span 
                variants={{
                  hidden: { scale: 0.92, opacity: 0, rotate: -1 },
                  visible: { 
                    scale: 1, 
                    opacity: 1,
                    rotate: 0,
                    transition: {
                      type: 'spring' as const,
                      stiffness: 110,
                      damping: 14,
                      delay: 0.2
                    }
                  }
                }}
                className="inline-block bg-brand-red text-white px-5 py-1.5 mt-4 mb-2 border-2 border-zinc-950 shadow-[5px_5px_0_0_#000] rounded-sm transform hover:scale-[1.01] transition-transform duration-300"
              >
                Instantly
              </motion.span>{' '}
              with AI
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="mt-8 max-w-2xl text-base md:text-lg font-medium leading-relaxed text-zinc-600"
            >
              The next generation of autonomous FAQ assistance. Get precise answers, absolute context, and real-time resolutions for your knowledge base.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              <Link
                href="/chat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-red text-white font-black uppercase tracking-[0.18em] text-xs px-8 py-4.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 ease-out"
              >
                Launch Dashboard
                <ArrowRight className="h-4 w-4 text-white" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-zinc-900 font-black uppercase tracking-[0.18em] text-xs px-8 py-4.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 ease-out"
              >
                Get Started Free
              </Link>
            </motion.div>
          </motion.section>

        </main>

      </div>
    </div>
  );
}

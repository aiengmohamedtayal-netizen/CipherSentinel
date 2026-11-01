import React, { useState, useRef, useMemo } from 'react';
import { motion, useScroll, AnimatePresence } from 'motion/react';
import { Network, TableProperties, ZoomIn, ZoomOut, Shield, CheckCircle2, Lock } from 'lucide-react';
import { ARCHITECTURE_NODES, SECURITY_METADATA } from '../data/reportData';
import { ArchitectureNode } from '../types';
import { LondonPollinatorMap } from './LondonPollinatorMap';

export const BoroughCorridorSection: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeListIndex, setActiveListIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const activeNodeInList = ARCHITECTURE_NODES[activeListIndex] || ARCHITECTURE_NODES[0];

  const handleSelectNodeFromMap = (id: string | null) => {
    setSelectedNodeId(id);
    if (id) {
      const idx = ARCHITECTURE_NODES.findIndex((n) => n.id === id);
      if (idx !== -1) {
        setActiveListIndex(idx);
      }
    }
  };

  const handleSelectNodeFromList = (idx: number) => {
    setActiveListIndex(idx);
    const selected = ARCHITECTURE_NODES[idx];
    if (selected) {
      setSelectedNodeId(selected.id);
    }
  };

  const scrollToCardTop = () => {
    if (cardContainerRef.current && typeof window !== 'undefined') {
      const cardTop = cardContainerRef.current.getBoundingClientRect().top + window.scrollY - 75;
      window.scrollTo({ top: Math.max(0, cardTop), behavior: 'smooth' });
    }
  };

  const handleSwitchToMap = () => {
    setViewMode('map');
    scrollToCardTop();
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.85));

  // Compute active display info for the bottom dark green bar
  const activeMetricsDisplay = useMemo(() => {
    const targetId = hoveredNodeId || selectedNodeId;
    if (targetId) {
      const node = ARCHITECTURE_NODES.find((n) => n.id === targetId);
      if (node) {
        return {
          title: `${node.name} (${node.category})`,
          stats: `${node.algorithm} • Standard: ${node.standard} • ${node.parameters} • Role: ${node.securityRole}`,
        };
      }
    }

    return {
      title: 'CipherSentinel Architecture Overview (8 Modules)',
      stats: `100% Client-Side Cryptographic Separation • AES-256-GCM Authenticated • RSA-OAEP Wrapped • Zero-Plaintext Vault Storage`,
    };
  }, [hoveredNodeId, selectedNodeId]);

  return (
    <section
      id="architecture-section"
      ref={containerRef}
      className="relative min-h-screen py-20 sm:py-28 px-4 sm:px-8 lg:px-12 flex flex-col justify-center border-t border-[#243324]/10 dark:border-white/10 bg-[#F5F2EB] dark:bg-[#182417] text-[#243324] dark:text-[#F4EFE6] transition-colors duration-400"
    >
      <div className="max-w-6xl mx-auto w-full space-y-8 sm:space-y-10">
        {/* Section Headline */}
        <div className="space-y-4 max-w-3xl">
          <p className="text-sm font-medium tracking-wide text-[#657351] dark:text-[#A3B59E]">
            Security Architecture & Cryptographic Workflow
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal leading-[1.05] tracking-tight">
            End-to-end cryptographic protection and advisory threat flow.
          </h2>
          <p className="text-base sm:text-lg text-[#4A5D44] dark:text-[#D2CBBF] font-light leading-relaxed">
            Trace how untrusted message inputs flow through local TF-IDF phishing evaluation, ephemeral AES-256-GCM authenticated encryption, RSA-OAEP key wrapping, and zero-plaintext vault storage.
          </p>
        </div>

        {/* Integrated Card Container Outlined with Dark Green */}
        <div
          ref={cardContainerRef}
          className="w-full bg-[#FBF9F5] dark:bg-[#152014] rounded-3xl sm:rounded-[2.5rem] border-2 border-[#243324] dark:border-[#384F35] shadow-lg overflow-hidden flex flex-col transition-colors duration-400"
        >
          {/* Left-Aligned Control Bar */}
          <div className="px-5 pt-5 pb-3 sm:px-8 sm:pt-6 sm:pb-4 flex flex-wrap items-center justify-between gap-4 bg-[#FBF9F5] dark:bg-[#152014] transition-colors duration-400">
            {/* View Switcher */}
            <div className="flex items-center bg-white/90 dark:bg-[#202E1E] backdrop-blur-md rounded-2xl border border-[#243324]/15 dark:border-white/15 p-1 shadow-2xs gap-1">
              <button
                type="button"
                onClick={handleSwitchToMap}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#243324] dark:bg-[#344732] text-white dark:text-[#F4EFE6] shadow-xs'
                    : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:text-[#1F2B1D] dark:hover:text-white hover:bg-[#F5F2EB] dark:hover:bg-[#2A3D28]'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Architecture Flow Graph (8 Modules)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#243324] dark:bg-[#344732] text-white dark:text-[#F4EFE6] shadow-xs'
                    : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:text-[#1F2B1D] dark:hover:text-white hover:bg-[#F5F2EB] dark:hover:bg-[#2A3D28]'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Specification Matrix</span>
              </button>
            </div>

            {/* Zoom Controls */}
            {viewMode === 'map' && (
              <div className="flex items-center bg-white/90 dark:bg-[#202E1E] backdrop-blur-md rounded-2xl border border-[#243324]/15 dark:border-white/15 p-1 shadow-2xs gap-1">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 text-[#243324] dark:text-[#F4EFE6] hover:bg-[#F5F2EB] dark:hover:bg-[#2A3D28] rounded-xl transition-colors cursor-pointer"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 text-[#243324] dark:text-[#F4EFE6] hover:bg-[#F5F2EB] dark:hover:bg-[#2A3D28] rounded-xl transition-colors cursor-pointer"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Card Body: Interactive Graph or Specification List */}
          <div className="relative w-full flex-1 bg-[#FBF9F5] dark:bg-[#152014] transition-colors duration-400">
            <AnimatePresence mode="wait">
              {viewMode === 'map' ? (
                <motion.div
                  key="map-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LondonPollinatorMap
                    selectedNodeId={selectedNodeId}
                    onSelectNode={handleSelectNodeFromMap}
                    onHoverNode={setHoveredNodeId}
                    zoomLevel={zoomLevel}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="list-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#FBF9F5] dark:bg-[#152014] transition-colors duration-400"
                >
                  {/* Module List Selector */}
                  <div className="lg:col-span-7 space-y-3">
                    {ARCHITECTURE_NODES.map((item, idx) => {
                      const isSelected = activeListIndex === idx;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectNodeFromList(idx)}
                          className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-[#223320] shadow-md border border-[#243324]/12 dark:border-white/20 scale-[1.01]'
                              : 'hover:bg-white/60 dark:hover:bg-[#1F2F1D] border border-[#243324]/6 dark:border-white/10 bg-white/40 dark:bg-[#1C2A1B]/60'
                          }`}
                        >
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between text-sm sm:text-base font-medium text-[#1F2B1D] dark:text-[#F4EFE6]">
                              <span>{item.name}</span>
                              <span className="text-xs font-mono uppercase text-[#657351] dark:text-[#A3B59E]">
                                {item.category}
                              </span>
                            </div>

                            <p className="text-xs text-[#4A5D44] dark:text-[#CBD7C7] font-light">
                              {item.algorithm} • {item.standard}
                            </p>

                            <div className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E]">
                              {item.parameters}
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span className="font-display text-xl sm:text-2xl text-[#1F2B1D] dark:text-[#F4EFE6] font-normal">
                              0{idx + 1}
                            </span>
                            <span className="block text-[10px] uppercase tracking-wider text-[#657351] dark:text-[#A3B59E]">
                              Phase
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detailed Module Insight Panel */}
                  <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
                    <motion.div
                      key={activeNodeInList.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#243723] border border-[#243324]/10 dark:border-white/12 shadow-md space-y-6"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2">
                          <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                            {activeNodeInList.standard}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#F4EFE6] font-mono">
                            {activeNodeInList.category}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl sm:text-3xl text-[#1F2B1D] dark:text-[#F4EFE6]">
                          {activeNodeInList.name}
                        </h3>
                        <p className="text-xs text-[#657351] dark:text-[#A3B59E] pt-1 font-mono">
                          {activeNodeInList.securityRole}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs uppercase font-semibold text-[#657351] dark:text-[#A3B59E] tracking-wider">
                          Cryptographic Objective
                        </p>
                        <p className="text-sm text-[#4A5D44] dark:text-[#CBD7C7] font-light leading-relaxed">
                          {activeNodeInList.description}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#F5F2EB] dark:bg-[#1E2E1D] border border-[#243324]/10 dark:border-white/10 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-[#657351] dark:text-[#A3B59E] block">
                          Technical Parameters
                        </span>
                        <p className="font-mono text-xs text-[#1F2B1D] dark:text-[#F4EFE6]">
                          {activeNodeInList.parameters}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs uppercase font-semibold text-[#657351] dark:text-[#A3B59E] tracking-wider">
                          Key Architectural Highlights
                        </p>
                        <ul className="space-y-2">
                          {activeNodeInList.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#4A5D44] dark:text-[#CBD7C7] leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Active Summary Bar */}
          <div className="px-5 py-4 sm:px-8 sm:py-5 bg-[#1F2B1D] dark:bg-[#121A11] text-[#F4EFE6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/10 transition-colors duration-400">
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              {activeMetricsDisplay.title}
            </span>
            <span className="text-xs text-[#CBD7C7] font-light leading-snug">
              {activeMetricsDisplay.stats}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

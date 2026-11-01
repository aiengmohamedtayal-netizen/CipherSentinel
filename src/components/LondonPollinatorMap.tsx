import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Key, Hash, Database, Cpu, BookOpen, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { ARCHITECTURE_NODES } from '../data/reportData';
import { ArchitectureNode } from '../types';

interface ArchitectureTopologyGraphProps {
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onHoverNode?: (nodeId: string | null) => void;
  zoomLevel: number;
}

export const LondonPollinatorMap: React.FC<ArchitectureTopologyGraphProps> = ({
  selectedNodeId,
  onSelectNode,
  onHoverNode,
  zoomLevel,
}) => {
  const [internalHoverId, setInternalHoverId] = useState<string | null>(null);

  const activeNode = useMemo(
    () => ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) || null,
    [selectedNodeId]
  );

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'Ingestion':
        return AlertCircle;
      case 'AI Intelligence':
        return Cpu;
      case 'Symmetric Crypto':
        return Lock;
      case 'Asymmetric Wrap':
        return Key;
      case 'Integrity':
        return Hash;
      case 'Storage':
        return Database;
      case 'Key Management':
        return Shield;
      default:
        return BookOpen;
    }
  };

  // SVG Flow Connections (fromNodeId -> toNodeId)
  const connections = [
    { from: 'node-ingest', to: 'node-ai-threat', label: 'Advisory Risk Scan' },
    { from: 'node-ingest', to: 'node-sha256', label: 'Hash Digest' },
    { from: 'node-ingest', to: 'node-aes-gcm', label: 'Payload Protection' },
    { from: 'node-aes-gcm', to: 'node-rsa-oaep', label: 'Wrap 256-bit DEK' },
    { from: 'node-rsa-oaep', to: 'node-vault', label: 'Persist Envelope' },
    { from: 'node-aes-gcm', to: 'node-vault', label: 'Ciphertext & 128-bit Tag' },
    { from: 'node-key-manager', to: 'node-rsa-oaep', label: '3072-bit Key Roles' },
    { from: 'node-key-manager', to: 'node-classical', label: 'Educational Isolation' },
  ];

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[660px] overflow-hidden rounded-[2.5rem] bg-[#172216] select-none border border-white/10 shadow-2xl">
      {/* Background Grid & Boundary Guides */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD7C7_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      {/* Trust Boundaries Labels */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none flex gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#CBD7C7]/60">
        <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
          Zone A: Untrusted Boundary
        </span>
        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/80">
          Zone B: In-Memory Cryptographic Core
        </span>
        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400/80">
          Zone C: Zero-Plaintext Vault Storage
        </span>
      </div>

      {/* SVG Interactive Canvas */}
      <div
        className="w-full h-full transition-transform duration-300 ease-out flex items-center justify-center p-4"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full max-w-[1000px] max-h-[600px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A6D47" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#CBD7C7" stopOpacity="0.9" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection Curves with Animated Dashes */}
          {connections.map((conn, idx) => {
            const startNode = ARCHITECTURE_NODES.find((n) => n.id === conn.from);
            const endNode = ARCHITECTURE_NODES.find((n) => n.id === conn.to);
            if (!startNode || !endNode) return null;

            const startX = (startNode.x / 100) * 1000;
            const startY = (startNode.y / 100) * 600;
            const endX = (endNode.x / 100) * 1000;
            const endY = (endNode.y / 100) * 600;

            const isHighlighted =
              selectedNodeId === conn.from ||
              selectedNodeId === conn.to ||
              internalHoverId === conn.from ||
              internalHoverId === conn.to;

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2 - 25;

            return (
              <g key={`conn-${idx}`}>
                <path
                  d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                  stroke={isHighlighted ? '#CBD7C7' : '#334831'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={isHighlighted ? '8 4' : '4 4'}
                  className="transition-all duration-300"
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r="2"
                  fill={isHighlighted ? '#F4EFE6' : '#4A6D47'}
                  className="animate-ping"
                  style={{ animationDuration: '3s' }}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {ARCHITECTURE_NODES.map((node) => {
            const cx = (node.x / 100) * 1000;
            const cy = (node.y / 100) * 600;
            const isSelected = selectedNodeId === node.id;
            const isHovered = internalHoverId === node.id;
            const Icon = getNodeIcon(node.category);

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                onClick={() => onSelectNode && onSelectNode(isSelected ? null : node.id)}
                onMouseEnter={() => {
                  setInternalHoverId(node.id);
                  onHoverNode && onHoverNode(node.id);
                }}
                onMouseLeave={() => {
                  setInternalHoverId(null);
                  onHoverNode && onHoverNode(null);
                }}
              >
                {/* Outer Pulsing Ring for Selected/Hovered Node */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 42 : 36}
                    fill="none"
                    stroke="#CBD7C7"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ animationDuration: '10s' }}
                  />
                )}

                {/* Node Background Body */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="28"
                  fill={isSelected ? '#384E36' : isHovered ? '#263724' : '#1F2E1E'}
                  stroke={isSelected ? '#F4EFE6' : isHovered ? '#CBD7C7' : '#4A6D47'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isSelected ? 'url(#glow)' : undefined}
                  className="transition-all duration-200"
                />

                {/* Node Status Dot */}
                <circle
                  cx={cx + 18}
                  cy={cy - 18}
                  r="5"
                  fill={node.category === 'Classical Sandbox' ? '#EAB308' : '#22C55E'}
                  stroke="#172216"
                  strokeWidth="1.5"
                />

                {/* Text Label Below Node */}
                <text
                  x={cx}
                  y={cy + 42}
                  textAnchor="middle"
                  fill={isSelected ? '#F4EFE6' : '#CBD7C7'}
                  fontSize={isSelected ? '12' : '11'}
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fontWeight={isSelected ? '600' : '400'}
                  className="transition-all select-none drop-shadow"
                >
                  {node.name.length > 22 ? `${node.name.substring(0, 20)}...` : node.name}
                </text>

                <text
                  x={cx}
                  y={cy + 56}
                  textAnchor="middle"
                  fill="#758B71"
                  fontSize="9"
                  fontFamily="'Plus Jakarta Sans', monospace"
                  className="select-none tracking-wider uppercase"
                >
                  {node.algorithm.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Floating Quick Inspector Card */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md p-5 rounded-3xl bg-[#1F2B1D]/95 backdrop-blur-md border border-white/15 text-[#F4EFE6] shadow-2xl z-20 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/20">
                  {activeNode.standard}
                </span>
                <h4 className="font-display text-lg text-white font-normal pt-1.5">
                  {activeNode.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onSelectNode && onSelectNode(null)}
                className="text-xs text-[#CBD7C7]/70 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#CBD7C7] font-light leading-relaxed">
              {activeNode.description}
            </p>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#CBD7C7]/80">
              <span>{activeNode.parameters}</span>
              <span className="text-emerald-400 font-medium">Active</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Lock,
  Cpu,
  Hash,
  Archive,
  Key,
  CheckCircle2,
  LayoutDashboard,
  Sun,
  Moon,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSessionActivity } from '../context/SessionContext';
import { NavigationTab } from '../types';
import { SecuritySettingsModal } from './SecuritySettingsModal';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crypto-lab', label: 'Crypto Lab', icon: Lock },
  { id: 'phishing', label: 'AI Phishing', icon: Cpu },
  { id: 'integrity', label: 'Hash & Integrity', icon: Hash },
  { id: 'vault', label: 'Secure Vault', icon: Archive },
  { id: 'keys', label: 'Key Manager', icon: Key },
  { id: 'testing', label: 'Testing Center', icon: CheckCircle2 },
];

export const Navbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { activeTab, setActiveTab, sessionOperationsCount, activeRsaKey } = useSessionActivity();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 w-full bg-[#FBF9F5]/90 dark:bg-[#131D12]/90 backdrop-blur-md border-b border-[#243324]/10 dark:border-white/10 transition-colors duration-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <button
            type="button"
            onClick={() => handleSelectTab('crypto-lab')}
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <div className="p-2 rounded-2xl bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] shadow-xs group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-xl font-medium tracking-tight text-[#1F2B1D] dark:text-[#F4EFE6]">
                  CipherSentinel
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#1F2B1D]/10 dark:bg-white/10 text-[#1F2B1D] dark:text-[#CBD7C7]">
                  Workbench
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#657351] dark:text-[#A3B59E] -mt-0.5 hidden sm:block">
                AI-Assisted Message Security
              </span>
            </div>
          </button>

          {/* Center: Desktop Navigation Bar with 7 Tabs */}
          <nav className="hidden xl:flex items-center gap-1 p-1 rounded-full bg-[#F5F2EB] dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 shadow-xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] shadow-xs font-semibold'
                      : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Compact Nav for Medium Screens (lg) */}
          <nav className="hidden lg:flex xl:hidden items-center gap-1 p-1 rounded-full bg-[#F5F2EB] dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10">
            {NAV_ITEMS.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] font-semibold'
                      : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Operations Counter, Theme Toggle & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Session Ops Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#F5F2EB] dark:bg-[#1A2619] border border-[#243324]/10 dark:border-white/10 text-[#1F2B1D] dark:text-[#CBD7C7]"
              title="Real cryptographic operations executed in active session"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{sessionOperationsCount} Ops</span>
            </div>

            {/* Sun / Moon Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-full border border-[#243324]/15 dark:border-white/15 bg-white/80 dark:bg-[#233522] text-[#1F2B1D] dark:text-[#F4EFE6] hover:bg-white dark:hover:bg-[#2c402a] transition-all cursor-pointer shadow-xs"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-full border border-[#243324]/15 dark:border-white/15 bg-white/80 dark:bg-[#233522] text-[#1F2B1D] dark:text-[#F4EFE6] cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-[#243324]/10 dark:border-white/10 bg-[#FBF9F5] dark:bg-[#131D12] px-4 py-4 space-y-1.5 shadow-lg"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-[#1F2B1D] dark:bg-[#CBD7C7] text-white dark:text-[#1F2B1D] font-semibold'
                        : 'text-[#4A5D44] dark:text-[#CBD7C7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

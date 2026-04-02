'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AudioLines, Home, Settings, Sparkles } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 glass-strong">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 ring-1 ring-primary/25 group-hover:ring-primary/50 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <AudioLines className="h-[18px] w-[18px] text-primary" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-[17px] font-bold tracking-tight leading-none">
                Echo<span className="text-primary">Lens</span>
              </span>
              <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground/60 leading-none mt-0.5">
                meeting intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-0.5">
            {[
              { href: '/', label: 'Dashboard', icon: Home },
            ].map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary/8 rounded-lg ring-1 ring-primary/15"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/settings"
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              pathname === '/settings'
                ? "text-primary bg-primary/8 ring-1 ring-primary/15"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <div className="w-px h-5 bg-border/50 mx-1" />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}

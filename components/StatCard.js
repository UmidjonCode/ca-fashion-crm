'use client';

import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { num } from '@/lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

const accents = {
  navy: {
    bg: 'bg-teal-500/10',
    border: 'border-[#2a2a35]',
    icon: 'text-teal-400',
    trend: 'text-teal-400',
    gradient: 'from-teal-500/20 to-transparent',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-[#2a2a35]',
    icon: 'text-emerald-400',
    trend: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-transparent',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-[#2a2a35]',
    icon: 'text-violet-400',
    trend: 'text-violet-400',
    gradient: 'from-violet-500/20 to-transparent',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-[#2a2a35]',
    icon: 'text-amber-400',
    trend: 'text-amber-400',
    gradient: 'from-amber-500/20 to-transparent',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-[#2a2a35]',
    icon: 'text-rose-400',
    trend: 'text-rose-400',
    gradient: 'from-rose-500/20 to-transparent',
  }
};

export default function StatCard({
  label,
  value = 0,
  icon: Icon,
  accent = 'navy',
  delay = 0,
  format = (v) => num(Math.round(v)),
  trendValue = '+12%',
  trendUp = true,
  variant = 'glass', // 'glass' or 'solid'
}) {
  const [display, setDisplay] = useState(0);
  const a = accents[accent] || accents.navy;

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);

  const baseClasses = "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover";
  const glassClasses = `bg-[#15151d] ${a.border}`;
  const solidClasses = `bg-gradient-to-br ${a.gradient} border-transparent`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`${baseClasses} ${variant === 'solid' ? solidClasses : glassClasses}`}
    >
      <div className="flex items-start justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-xl ${a.bg}`}>
          {Icon && <Icon className={`h-6 w-6 ${a.icon}`} />}
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${variant === 'solid' ? 'bg-black/20 text-white' : 'bg-[#1f1f2a] ' + a.trend}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trendValue}
        </div>
      </div>
      
      <div className="mt-6">
        <p className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
          {format(display)}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          {label}
        </p>
      </div>

      {variant === 'solid' && (
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white opacity-5 blur-2xl" />
      )}
    </motion.div>
  );
}

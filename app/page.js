'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ShoppingCart, PoundSterling, Truck, ArrowRight, Package, CheckCircle2, Clock, RotateCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { money, money0, fmtDate } from '@/lib/format';

const statusIcons = {
  pending: Clock,
  processing: RotateCw,
  shipped: Truck,
  delivered: CheckCircle2,
};

const statusColors = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  processing: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  shipped: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const kpis = data?.kpis;
  const recentOrders = data?.recentOrders ?? [];
  const breakdown = data?.statusBreakdown ?? { pending: 0, processing: 0, shipped: 0, delivered: 0 };

  return (
    <div>
      {/* 
        We replaced the standard PageHeader with a subtle greeting.
        The layout is now an asymmetrical "Bento Box" grid.
      */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Remodul</h1>
          <p className="mt-1 text-sm text-zinc-500">Welcome back — here's how Retake CRM is performing.</p>
        </div>
        <Link href="/orders" className="btn-primary">
          <Package className="h-4 w-4" /> New Order
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {/* Hero Card - Revenue (Spans 2 columns) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c2e2e] to-[#111116] border border-teal-500/20 p-8 shadow-card lg:col-span-2"
        >
          {/* Decorative background glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500 opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-30" />
          
          <div>
            <div className="flex items-center gap-2 text-teal-400">
              <PoundSterling className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Total Revenue</span>
            </div>
            <p className="mt-4 text-5xl font-extrabold tracking-tighter text-white tabular-nums">
              {money0(kpis?.revenue ?? 0)}
            </p>
            <p className="mt-2 text-sm font-medium text-teal-400/80">
              +24% from last month
            </p>
          </div>
          
          <div className="mt-8 flex items-center justify-between border-t border-teal-500/10 pt-6">
            <p className="text-sm text-zinc-400">Great performance this week. Keep it up!</p>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-400 transition-colors hover:bg-teal-500 hover:text-charcoal">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Regular KPI Cards */}
        <StatCard 
          label="Total Orders" 
          value={kpis?.orders ?? 0} 
          icon={ShoppingCart} 
          accent="violet" 
          delay={0.1} 
          trendValue="+14%"
          variant="glass"
        />
        
        <StatCard 
          label="Active Shipments" 
          value={kpis?.activeShipments ?? 0} 
          icon={Truck} 
          accent="amber" 
          delay={0.2} 
          trendValue="+5%"
          variant="glass"
        />

        {/* Customer Growth Card (Solid variant) */}
        <StatCard 
          label="Total Customers" 
          value={kpis?.customers ?? 0} 
          icon={Users} 
          accent="emerald" 
          delay={0.3} 
          trendValue="+8%"
          variant="solid"
        />

        {/* Recent Orders - Timeline Layout */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="nexus-card col-span-1 p-6 lg:col-span-2 xl:col-span-2"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Activity</h2>
            <Link href="/orders" className="text-xs font-semibold text-teal-400 hover:text-teal-300">
              View all orders &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingDots />
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.slice(0, 4).map((o) => {
                const SIcon = statusIcons[o.status] || Package;
                const sColor = statusColors[o.status] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
                
                return (
                  <div key={o.id} className="group relative flex items-center gap-4 rounded-xl border border-[#2a2a35] bg-[#15151d] p-4 transition-colors hover:border-teal-500/30">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${sColor}`}>
                      <SIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-zinc-200">
                        {o.customer || 'Unknown customer'}
                      </p>
                      <p className="truncate text-xs font-medium text-zinc-500">
                        {o.order_number} · {fmtDate(o.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white tabular-nums">
                        {money(o.total)}
                      </p>
                      <p className="text-xs font-medium capitalize text-zinc-500">
                        {o.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Order Status - Breakout Metric Cards instead of stacked bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="col-span-1 lg:col-span-3 xl:col-span-1 flex flex-col gap-4"
        >
          <h2 className="text-base font-bold text-white mb-2">Order Status</h2>
          
          {['pending', 'processing', 'shipped', 'delivered'].map((s, i) => {
            const count = breakdown[s] || 0;
            const sColor = statusColors[s];
            const SIcon = statusIcons[s];
            
            return (
              <div key={s} className="flex items-center justify-between rounded-xl border border-[#2a2a35] bg-[#1a1a23] p-4 shadow-sm transition-all hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${sColor.replace('border-', '')}`}>
                    <SIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold capitalize text-zinc-300">{s}</span>
                </div>
                <span className="text-lg font-bold text-white tabular-nums">{count}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="loading-dots">
      <span />
      <span />
      <span />
    </div>
  );
}

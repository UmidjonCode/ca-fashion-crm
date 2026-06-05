'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Shirt,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
];

function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function getCurrentPageName(pathname) {
  const item = navItems.find((n) =>
    n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)
  );
  return item?.name || 'Dashboard';
}

/* ─── Icon Rail (Desktop) ─── */
function IconRail({ pathname, handleLogout }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[72px] flex-col items-center border-r border-[#2a2a35] bg-[#111116] md:flex">
      {/* Brand icon */}
      <div className="flex h-14 w-full items-center justify-center border-b border-[#2a2a35]">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500">
          <Shirt className="h-4.5 w-4.5 text-charcoal" />
        </div>
      </div>

      {/* Nav icons */}
      <nav className="mt-4 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200"
              aria-label={item.name}
            >
              {/* Active background */}
              {active && (
                <motion.span
                  layoutId="rail-active"
                  className="absolute inset-0 rounded-xl bg-[#22222d]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`relative h-[20px] w-[20px] transition-colors duration-150 ${
                  active ? 'text-teal-400' : 'text-zinc-600 group-hover:text-zinc-400'
                }`}
              />
              {/* Active dot */}
              {active && (
                <motion.span
                  layoutId="rail-dot"
                  className="absolute -right-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-teal-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 rounded-md bg-[#22222d] border border-[#2a2a35] px-2.5 py-1 text-xs font-medium text-zinc-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom user avatar */}
      <div className="mt-auto mb-4 flex flex-col items-center gap-3">
        <button
          onClick={handleLogout}
          className="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:bg-[#22222d] text-zinc-500 hover:text-red-400"
          aria-label="Logout"
        >
          <LogOut className="h-[20px] w-[20px]" />
          <span className="pointer-events-none absolute left-full ml-3 rounded-md bg-[#22222d] border border-[#2a2a35] px-2.5 py-1 text-xs font-medium text-zinc-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
            Chiqish
          </span>
        </button>
        <div className="relative">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-bold text-charcoal">
            ST
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111116] bg-emerald-400" />
        </div>
      </div>
    </aside>
  );
}

/* ─── Top Bar ─── */
function TopBar({ pathname, onOpenMobile }) {
  const pageName = getCurrentPageName(pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-[#2a2a35] bg-[#111116]/95 backdrop-blur-md md:pl-[72px]">
      <div className="flex w-full items-center justify-between px-5 sm:px-8">
        {/* Left: mobile hamburger + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onOpenMobile}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#2a2a35] text-zinc-500 transition-colors hover:bg-[#22222d] hover:text-zinc-300 md:hidden"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="font-bold text-zinc-200 hover:text-teal-400 transition-colors">
              CA Fashion
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            <span className="font-medium text-zinc-500">{pageName}</span>
          </div>
        </div>

        {/* Right: user info */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-xs font-semibold text-zinc-300">Sales Team</p>
            <p className="text-[11px] text-zinc-600">Admin</p>
          </div>
          <div className="relative md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-bold text-charcoal">
              ST
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#111116] bg-emerald-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Mobile Drawer ─── */
function MobileDrawer({ open, onClose, pathname, handleLogout }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          >
            <div className="flex h-full flex-col border-r border-[#2a2a35] bg-[#111116]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500">
                    <Shirt className="h-4.5 w-4.5 text-charcoal" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">CA Fashion</p>
                    <p className="text-[11px] text-zinc-600">Wholesale CRM</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#2a2a35] text-zinc-500 hover:bg-[#22222d] hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-0.5 px-3">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-[#22222d] text-teal-400'
                          : 'text-zinc-500 hover:bg-[#1a1a23] hover:text-zinc-300'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.name}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="mt-auto px-4 pb-5">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex items-center gap-3 rounded-lg border border-[#2a2a35] bg-[#15151d] p-3">
                    <div className="relative">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-bold text-charcoal">
                        ST
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#15151d] bg-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">Sales Team</p>
                      <p className="text-[11px] text-zinc-600">Online · Admin</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="grid h-12 w-12 place-items-center rounded-lg border border-[#2a2a35] bg-[#15151d] text-zinc-500 hover:bg-[#22222d] hover:text-red-400"
                    aria-label="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Export ─── */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (pathname === '/login') return null;

  return (
    <>
      <IconRail pathname={pathname} handleLogout={handleLogout} />
      <TopBar pathname={pathname} onOpenMobile={() => setOpen(true)} />
      <MobileDrawer open={open} onClose={() => setOpen(false)} pathname={pathname} handleLogout={handleLogout} />
    </>
  );
}

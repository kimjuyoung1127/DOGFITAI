"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Brain, Zap, History, Settings as SettingsIcon, Home, Rocket, BarChart2, Settings2 } from 'lucide-react'; // Added more icons for flexibility

const navItems = [
  { href: '/profile', label: '프로필', icon: User, iconLabel: '🐶' },
  { href: '/result', label: '추천', icon: Brain, iconLabel: '🧠' },
  { href: '/play', label: '운동', icon: Zap, iconLabel: '🏃' },
  { href: '/history', label: '기록', icon: History, iconLabel: '🕒' },
  { href: '/settings', label: '설정', icon: SettingsIcon, iconLabel: '⚙️' },
];

export default function NavigationBar({ isLoggedIn = true }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Handle dynamic routes for /play and /profile
    if (href === '/play') {
      return pathname.startsWith('/play');
    }
    if (href === '/profile') {
      return pathname.startsWith('/profile');
    }
    // For /result, ensure it's an exact match or startsWith if it can have sub-routes.
    if (href === '/result') {
        return pathname === href || pathname.startsWith('/result/');
    }
    return pathname === href;
  };

  if (!isLoggedIn) {
    return null; // Or some other UI for logged-out users
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex justify-around items-center md:hidden print:hidden">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors hover:bg-muted min-w-[60px] ${
              active
                ? 'text-primary font-semibold' // Active state color
                : 'text-muted-foreground'
            }`}
          >
            <IconComponent className={`h-6 w-6 mb-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-xs">{item.iconLabel} {item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

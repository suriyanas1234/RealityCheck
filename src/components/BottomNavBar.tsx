'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Utensils, HeartHandshake, ShieldCheck, SlidersHorizontal } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Today', icon: LayoutDashboard },
    { href: '/meals', label: 'Meals', icon: Utensils },
    { href: '/initiative', label: 'Initiative', icon: HeartHandshake },
    { href: '/vault', label: 'Vault', icon: ShieldCheck },
    { href: '/signup', label: 'Setup', icon: SlidersHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#191919] border-t border-[#373737] pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 px-4">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-[#337EA9]' : 'text-[#838383] hover:text-[#E3E3E3]'
              }`}
            >
              <Icon className="w-5 h-5 mb-1 stroke-[1.8]" />
              <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#337EA9] mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

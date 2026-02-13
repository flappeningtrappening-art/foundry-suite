"use client";

import React from "react";
import { 
  Activity, 
  Gavel, 
  GraduationCap, 
  Code2, 
  Building2, 
  Mail, 
  Twitter, 
  ShieldCheck, 
  HardHat, 
  Truck,
  Zap,
  LayoutDashboard,
  Settings,
  Database
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PRODUCTION_LINES = [
  { name: "FINANCE", icon: Activity, url: "http://localhost:3000", color: "text-blue-500" },
  { name: "X-THREAD", icon: Twitter, url: "http://localhost:3001", color: "text-sky-400" },
  { name: "LEGAL", icon: Gavel, url: "http://localhost:3002", color: "text-amber-600" },
  { name: "GRANTS", icon: GraduationCap, url: "http://localhost:3003", color: "text-purple-500" },
  { name: "CODE", icon: Code2, url: "http://localhost:3004", color: "text-emerald-500" },
  { name: "REALTY", icon: Building2, url: "http://localhost:3005", color: "text-orange-500" },
  { name: "OUTREACH", icon: Mail, url: "http://localhost:3006", color: "text-rose-500" },
];

export function IndustrialSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-zinc-950 text-zinc-400 flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Brand / Logo */}
      <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold italic shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">G</div>
        <div>
                      <h1 className="text-sm font-bold tracking-tighter italic text-zinc-100">THE FOUNDRY</h1>          <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-500">Solution Factory</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-4 space-y-8">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-4 px-2">Core Command</p>
          <div className="space-y-1">
            <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${pathname === '/' ? 'bg-zinc-900 text-primary' : 'hover:bg-zinc-900 hover:text-zinc-100'}`}>
              <LayoutDashboard className="w-4 h-4" /> Lobby Console
            </Link>
            <Link href="/factory-stats" className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${pathname === '/factory-stats' ? 'bg-zinc-900 text-primary' : 'hover:bg-zinc-900 hover:text-zinc-100'}`}>
              <Zap className="w-4 h-4 text-amber-500 shadow-sm" /> Factory Stats (TPS)
            </Link>
            <Link href="/shared-vault" className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${pathname === '/shared-vault' ? 'bg-zinc-900 text-primary' : 'hover:bg-zinc-900 hover:text-zinc-100'}`}>
              <Database className="w-4 h-4" /> Yokoten Vault
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-4 px-2">Active Production Lines</p>
          <div className="space-y-1">
            {PRODUCTION_LINES.map((line) => (
              <a key={line.name} href={line.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group px-3 py-2 rounded-md text-xs font-bold transition-colors hover:bg-zinc-900 hover:text-zinc-100">
                <div className="flex items-center gap-3">
                  <line.icon className={`w-4 h-4 ${line.color} opacity-70 group-hover:opacity-100`} />
                  <span>{line.name}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse hidden group-hover:block" />
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* System Health Footer */}
      <div className="p-4 border-t border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-bold uppercase text-zinc-600">6-Sigma Status</p>
          <p className="text-[8px] font-mono text-green-500">99.98%</p>
        </div>
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-[99%]" />
        </div>
        <div className="flex items-center justify-between text-zinc-500">
          <Settings className="w-3 h-3 hover:text-zinc-100 cursor-pointer" />
          <p className="text-[8px] font-bold">NODE: US-EAST-1</p>
        </div>
      </div>
    </aside>
  );
}

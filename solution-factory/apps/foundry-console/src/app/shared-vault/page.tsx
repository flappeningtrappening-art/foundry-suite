"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Database, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Filter,
  CheckCircle2,
  Tag
} from "lucide-react";

export default function SharedVault() {
  const [findings, setFindings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    async function loadVault() {
      const { data } = await supabase
        .from("shared_intelligence_vault")
        .select(`
          *,
          analysis_cases (name)
        `)
        .order("created_at", { ascending: false });
      setFindings(data || []);
      setIsLoading(false);
    }
    loadVault();
  }, []);

  const filteredFindings = filter === "all" 
    ? findings 
    : findings.filter(f => f.finding_type === filter);

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter italic uppercase text-primary flex items-center gap-3">
            <Database className="w-8 h-8" />
            Yokoten Truth Vault
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">Cross-Agent Intelligence Repository</p>
        </div>
        <div className="flex gap-2">
          {["all", "fact", "contradiction", "anomaly"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                filter === t 
                ? "bg-primary border-primary text-primary-foreground shadow-lg" 
                : "bg-white border-zinc-200 text-zinc-500 hover:border-primary/40"
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200 animate-pulse">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300 italic">Accessing Shared Hive-Mind...</p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <Database className="w-12 h-12 text-zinc-200 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">The vault is currently empty.</p>
            <p className="text-[10px] text-zinc-400 mt-1">Run an agent to populate the shared truth layer.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <Card key={finding.id} className="hover:border-primary/30 transition-all bg-white overflow-hidden group">
              <div className="flex flex-col md:flex-row">
                {/* Finding Metadata Side */}
                <div className={`md:w-48 p-4 border-b md:border-b-0 md:border-r border-zinc-100 flex flex-col justify-between ${
                  finding.finding_type === 'contradiction' ? 'bg-red-50/30' : 
                  finding.finding_type === 'anomaly' ? 'bg-amber-50/30' : 'bg-zinc-50/30'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {finding.finding_type === 'contradiction' ? <AlertTriangle className="w-3 h-3 text-red-600" /> :
                       finding.finding_type === 'anomaly' ? <Search className="w-3 h-3 text-amber-600" /> :
                       <ShieldCheck className="w-3 h-3 text-green-600" />}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        finding.finding_type === 'contradiction' ? 'text-red-600' :
                        finding.finding_type === 'anomaly' ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {finding.finding_type}
                      </span>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold uppercase text-zinc-400 mb-1">Source Node</p>
                      <p className="text-[10px] font-mono font-bold text-zinc-900 italic">{finding.source_agent}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-zinc-400 uppercase">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(finding.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                        {finding.analysis_cases?.name || "Global Discovery"}
                      </p>
                      <p className="text-sm font-medium text-zinc-900 leading-relaxed font-serif">
                        "{finding.content}"
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold uppercase text-zinc-400 mb-1">Confidence</p>
                      <p className="text-xs font-mono font-bold text-zinc-900 italic">{(finding.confidence_score * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3 h-3 text-zinc-400" />
                      <div className="flex gap-1">
                        {finding.tags?.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 text-[8px] font-bold uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {finding.is_verified ? (
                        <span className="flex items-center gap-1 text-[8px] font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Jidoka Verified
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-zinc-400 uppercase italic">Awaiting Human-In-Loop</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

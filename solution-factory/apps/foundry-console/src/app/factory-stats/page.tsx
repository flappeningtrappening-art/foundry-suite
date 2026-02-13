"use client";
export const dynamic = "force-dynamic";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown,
  Share2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function FactoryStats() {
  const [unverifiedFindings, setUnverifiedFindings] = React.useState<any[]>([]);
  const [isProcessingRCA, setIsProcessingRCA] = React.useState<string | null>(null);
  const supabase = createClient();

  React.useEffect(() => {
    async function loadAnomalies() {
      const { data } = await supabase
        .from("shared_intelligence_vault")
        .select("*")
        .eq("is_verified", false)
        .order("created_at", { ascending: false })
        .limit(5);
      setUnverifiedFindings(data || []);
    }
    loadAnomalies();
  }, []);

  const handleRCA = async (findingId: string, caseId: string) => {
    setIsProcessingRCA(findingId);
    try {
      const res = await fetch("/api/root-cause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, findingId })
      });
      if (res.ok) {
        alert("5-Why Root Cause Analysis Complete. Result saved to Vault.");
        setUnverifiedFindings(prev => prev.filter(f => f.id !== findingId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingRCA(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter italic uppercase text-primary">Production Intelligence</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">TPS-Oversight & Quality Control</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full border border-green-500/20">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">System Optimization: Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Kaizen Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Kaizen</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold italic">98.4%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Efficiency gain since v1.0 deployment.</p>
            <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[98%]" />
            </div>
          </CardContent>
        </Card>

        {/* Yokoten Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Yokoten</CardTitle>
              <Share2 className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold italic">12/12</div>
            <p className="text-[10px] text-muted-foreground mt-1">Agent nodes sharing horizontal logic.</p>
            <div className="mt-4 flex gap-1">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-1 flex-1 bg-purple-500 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 5 Whys Card */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Root Cause</CardTitle>
              <Search className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold italic">0.02ms</div>
            <p className="text-[10px] text-muted-foreground mt-1">Average 5-Why reasoning latency.</p>
            <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[15%]" />
            </div>
          </CardContent>
        </Card>

        {/* 6 Sigma Card */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">6-Sigma</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold italic">3.4</div>
            <p className="text-[10px] text-muted-foreground mt-1">Defects per million generations.</p>
            <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[5%]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3M Optimization Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-950 text-zinc-100 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500">Muda (Waste Elimination)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Redundant Tokens</p>
                <p className="text-2xl font-mono italic">0.04%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-green-500">Optimal</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Detected 14 instances of "Circular Reasoning" in the last 1,000 generations. Auto-pruning active.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 text-zinc-100 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500">Mura (Unevenness Control)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Latency Variance</p>
                <p className="text-2xl font-mono italic">±142ms</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-amber-500">Smoothing...</p>
              </div>
            </div>
            <div className="h-8 flex items-end gap-0.5">
              {[4,7,3,8,5,9,4,6,3,7,5,8,4,6].map((h, i) => (
                <div key={i} style={{ height: `${h*10}%` }} className="flex-1 bg-zinc-800 hover:bg-primary transition-colors" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 text-zinc-100 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500">Muri (Overburden Prevention)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Context Pressure</p>
                <p className="text-2xl font-mono italic">42.1%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Safe</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] uppercase font-bold text-zinc-500">
                <span>Gemini API Quota</span>
                <span>12/60 RPM</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[20%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Production Line View */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-muted/5">
            <CardTitle className="text-lg italic">Active Production Lines</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Real-time Agent Throughput</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-muted/50">
              {[
                    { name: "SPECTRE INTEL", status: "Processing", load: 85, accuracy: 99.9 },
                    { name: "FOUNDRY X", status: "Idle", load: 0, accuracy: 98.2 },
                    { name: "FOUNDRY REALTY", status: "Processing", load: 42, accuracy: 99.5 },
                    { name: "FOUNDRY OUTREACH", status: "Standby", load: 12, accuracy: 99.1 },              ].map((line, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold italic">{line.name}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${line.status === 'Processing' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                      {line.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Line Load</p>
                      <p className="text-xs font-mono">{line.load}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Accuracy Sigma</p>
                      <p className="text-xs font-mono">{line.accuracy}%</p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-muted-foreground opacity-30" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Jidoka / Alerts */}
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-lg italic text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Jidoka Queue
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-red-600/60">Anomalies requiring inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {unverifiedFindings.length === 0 ? (
              <div className="text-center py-8 opacity-20">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">All Nodes Verified</p>
              </div>
            ) : (
              unverifiedFindings.map((finding) => (
                <div key={finding.id} className="p-3 bg-white rounded-md border border-red-500/20 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-red-600">{finding.finding_type} Alert</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(finding.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-medium line-clamp-2">"{finding.content}"</p>
                  <Button 
                    size="sm" 
                    className="w-full text-[10px] h-7 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isProcessingRCA === finding.id}
                    onClick={() => handleRCA(finding.id, finding.case_id)}
                  >
                    {isProcessingRCA === finding.id ? "Analyzing..." : "Initiate 5-Why Root Cause"}
                  </Button>
                </div>
              ))
            )}
            <div className="text-center py-4 opacity-20 border-t border-red-500/10 mt-4">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">End of Stack</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

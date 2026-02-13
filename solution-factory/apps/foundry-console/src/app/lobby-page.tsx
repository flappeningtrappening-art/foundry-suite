"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  FolderOpen, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  Activity,
  Twitter,
  Building2,
  Mail,
  Search
} from "lucide-react";
import Link from "next/link";

const FOUNDRY_TOOLS = [
  { id: "intel", name: "SPECTRE INTEL", icon: Activity, url: "http://localhost:3000", color: "bg-blue-500" },
  { id: "x", name: "FOUNDRY X", icon: Twitter, url: "http://localhost:3001", color: "bg-sky-400" },
  { id: "realty", name: "FOUNDRY REALTY", icon: Building2, url: "http://localhost:3005", color: "bg-orange-500" },
  { id: "outreach", name: "FOUNDRY OUTREACH", icon: Mail, url: "http://localhost:3006", color: "bg-rose-500" },
];

export default function LobbyDashboard({ user }: { user: any }) {
  const [cases, setCases] = useState<any[]>([]);
  const [newCaseName, setNewCaseName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadCases() {
      const { data } = await supabase
        .from("analysis_cases")
        .select("*")
        .order("created_at", { ascending: false });
      setCases(data || []);
      setIsLoading(false);
    }
    loadCases();
  }, []);

  async function createCase() {
    if (!newCaseName) return;
    const { data } = await supabase
      .from("analysis_cases")
      .insert({ name: newCaseName, user_id: user.id })
      .select()
      .single();
    
    if (data) {
      setCases([data, ...cases]);
      setNewCaseName("");
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Case Creation */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-zinc-900 text-zinc-100 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold tracking-tight italic flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                INITIATE CASE
              </CardTitle>
              <CardDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                Deploy Agentic Orchestration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="caseName" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Case Identifier</Label>
                <Input 
                  id="caseName"
                  placeholder="e.g. PROJECT_OMEGA_AUDIT" 
                  value={newCaseName}
                  onChange={(e) => setNewCaseName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-700 font-mono italic"
                />
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold italic" onClick={createCase}>
                Launch Orchestrator
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Global Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 pb-2">
                <span className="text-zinc-500 font-medium">Active Production Cases</span>
                <span className="font-mono font-bold text-zinc-900">{cases.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Yokoten Truth Facts</span>
                <span className="font-mono font-bold text-green-600">Calculated...</span>
              </div>
            </CardContent>
          </Card>

          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mt-8 mb-4">Production Nodes</h3>
          <div className="space-y-3">
            {FOUNDRY_TOOLS.map((tool) => (
              <a 
                key={tool.id} 
                href={tool.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-200 hover:border-primary/40 transition-all shadow-sm group"
              >
                <div className={`p-2 rounded-lg ${tool.color} text-white`}>
                  <tool.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold italic tracking-tight">{tool.name}</p>
                  <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Deploy Node</p>
                </div>
                <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
        </div>

        {/* Right: Case List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-zinc-900 flex items-center italic tracking-tight">
              <FolderOpen className="mr-3 h-5 w-5 text-primary" /> 
              ACTIVE CASE LOADS
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Filter Cases..." 
                className="pl-8 pr-4 py-1.5 rounded-full bg-zinc-100 border-none text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 w-48"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center animate-pulse bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300 italic">Synchronizing Factory...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5">
                <p className="text-xs font-bold uppercase tracking-widest">No active case loads detected.</p>
              </div>
            ) : (
              cases.map((item) => (
                <Card key={item.id} className="hover:border-primary/40 transition-all group overflow-hidden bg-white">
                  <Link href={`/case/${item.id}`} className="block">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-xl font-bold italic text-zinc-900 tracking-tight">{item.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-green-100 text-green-700 tracking-widest">Live</span>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">CASE ID: {item.id.slice(0, 8)}... • Created {new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-all text-primary group-hover:translate-x-1" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Documents: Syncing...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Discrepancies: 0</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center">
                            Enter Loading Dock <ArrowRight className="ml-1 w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
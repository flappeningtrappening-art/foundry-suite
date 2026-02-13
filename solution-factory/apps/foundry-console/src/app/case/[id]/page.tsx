"use client";

import React, { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  ChevronLeft, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  Activity,
  Twitter,
  Building2,
  Mail,
  Search
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FOUNDRY_TOOLS = [
  { id: "intel", name: "SPECTRE INTEL", icon: Activity, url: "http://localhost:3000", color: "bg-blue-500" },
  { id: "x", name: "FOUNDRY X", icon: Twitter, url: "http://localhost:3001", color: "bg-sky-400" },
  { id: "realty", name: "FOUNDRY REALTY", icon: Building2, url: "http://localhost:3005", color: "bg-orange-500" },
  { id: "outreach", name: "FOUNDRY OUTREACH", icon: Mail, url: "http://localhost:3006", color: "bg-rose-500" },
];

export default function HubCaseRoom(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [caseData, setCaseData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadCase() {
      const { data } = await supabase
        .from("analysis_cases")
        .select("*")
        .eq("id", params.id)
        .single();
      setCaseData(data);
      await loadDocuments();
    }
    loadCase();
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleAnalyze = async () => {
    if (!query) return;
    setIsAnalyzing(true);
    setAnalysisResult("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, caseId: params.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysisResult(data.report);
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDocuments = async () => {
    const { data } = await supabase
      .from("case_documents")
      .select("*")
      .eq("case_id", params.id);
    setDocuments(data || []);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Remove this document from the factory?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("case_documents").delete().eq("id", docId);
    await loadDocuments();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !caseData) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = `${user!.id}/${params.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("case-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: docRecord, error: dbError } = await supabase
        .from("case_documents")
        .insert({
          case_id: params.id,
          user_id: user!.id,
          file_name: file.name,
          file_type: file.type,
          storage_path: filePath,
          metadata: { status: "indexing" }
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setDocuments(prev => [...prev, docRecord]);

      await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docRecord.id })
      });

    } catch (err) {
      console.error("Hub Upload Error:", err);
      alert("Failed to upload document to the Loading Dock.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!caseData) return <div className="p-20 text-center animate-pulse">Synchronizing Case Room...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild><Link href="/"><ChevronLeft className="h-5 w-5" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight italic text-zinc-900 uppercase">{caseData.name}</h1>
          <p className="text-zinc-500 uppercase text-[10px] tracking-[0.3em] font-bold">Primary Loading Dock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Global Ingest */}
        <div className="space-y-6">
          <Card className="border-zinc-200 bg-white">
            <CardHeader className="border-b bg-zinc-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center justify-between text-zinc-900">
                Data Ingest
                <label className="cursor-pointer hover:text-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Case Asset Management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {isUploading && (
                <div className="flex items-center gap-2 p-3 text-[10px] font-bold uppercase text-primary animate-pulse bg-primary/5 rounded-md border border-primary/10">
                  <Loader2 className="h-3 w-3 animate-spin" /> Ingesting Assets...
                </div>
              )}
              {documents.length === 0 && !isUploading ? (
                <div className="text-center py-12 text-zinc-400 border-2 border-dashed rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-widest">No assets in dock</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-md bg-zinc-50 text-[10px] border border-zinc-100 group font-bold uppercase tracking-widest">
                    <FileText className="h-3 w-3 text-zinc-400" />
                    <span className="truncate flex-1 text-zinc-600">{doc.file_name}</span>
                    <div className="flex items-center gap-2">
                      {doc.metadata?.status === "ready" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                      )}
                      <button onClick={() => handleDelete(doc.id)} className="text-zinc-300 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Agent Deployment & Forensic Console */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/10 border-b border-primary/20">
              <CardTitle className="text-xl font-bold italic flex items-center gap-3">
                <Activity className="w-6 h-6 text-primary" />
                FORENSIC INTELLIGENCE CONSOLE
              </CardTitle>
              <CardDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                Direct Neural Link to Anatruth Engine
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <textarea
                className="w-full h-32 bg-zinc-950 border-zinc-800 rounded-md p-4 text-sm font-mono italic text-zinc-100 placeholder:text-zinc-700 focus:ring-1 focus:ring-primary outline-none"
                placeholder="Enter forensic query... (e.g. 'Identify all financial anomalies in the Q4 section')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || documents.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold italic uppercase tracking-widest"
              >
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {isAnalyzing ? "Executing Forensic Chain..." : "Execute Analysis"}
              </Button>

              {analysisResult && (
                <div className="mt-6 p-6 bg-zinc-950 border border-zinc-800 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="text-[10px] font-bold uppercase text-primary mb-4 tracking-[0.3em]">Forensic Report Output</h4>
                  <div className="text-sm leading-relaxed text-zinc-300 font-serif whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <h3 className="text-xl font-bold italic tracking-tight text-zinc-900 flex items-center gap-3 pt-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
            CROSS-APP DEPLOYMENT
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FOUNDRY_TOOLS.map((tool) => (
              <Card key={tool.id} className="hover:border-primary/40 transition-all bg-white group cursor-pointer border-zinc-200">
                <a href={tool.url} target="_blank" rel="noopener noreferrer">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl ${tool.color} text-white shadow-lg`}>
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded">Operational</span>
                    </div>
                    <CardTitle className="text-lg italic mt-4">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                      Deploy specialized forensic {tool.name.toLowerCase()} agents to this case load. 
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between items-center text-primary group-hover:underline">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Execute Node</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </CardFooter>
                </a>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Search, Loader2, CheckCircle2, ChevronLeft, Upload, ShieldCheck, Trash2, Download } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useReactToPrint } from "react-to-print";

export default function CaseRoom(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [caseData, setCaseRoom] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("Analyze these documents for inconsistencies, financial discrepancies, and timeline anomalies.");
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisCitations, setAnalysisCitations] = useState<any[]>([]);
  const [useGeneralKnowledge, setUseGeneralKnowledge] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const supabase = createClient();
  
  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `SPECTRE_INTEL_REPORT_${new Date().getTime()}`,
  });

  useEffect(() => {
    async function loadCase() {
      const { data: caseRes } = await supabase
        .from("analysis_cases")
        .select("*")
        .eq("id", params.id)
        .single();
      setCaseRoom(caseRes);
      
      await loadDocuments();
    }
    loadCase();

    // Poll for status updates every 5s
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  const loadDocuments = async () => {
    const { data: docRes } = await supabase
      .from("case_documents")
      .select("*")
      .eq("case_id", params.id);
    setDocuments(docRes || []);
  };

  const clearStuckUploads = async () => {
    if (!confirm("Remove all files stuck in 'processing'?")) return;
    await fetch("/api/reset-status", { method: "POST" });
    await loadDocuments();
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/document/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId })
    });
    await loadDocuments();
  };

  const handleAnalysis = async () => {
    if (!query || !caseData) return;
    setIsAnalyzing(true);
    setAnalysisResult("");
    setAnalysisCitations([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, caseId: params.id, includeGeneralKnowledge: useGeneralKnowledge }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalysisResult(data.analysis);
      setAnalysisCitations(data.sources || []);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Ensure the Anatruth Engine is active.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContradictionAnalysis = async () => {
    if (selectedDocs.length < 2 || !caseData) return;
    setIsAnalyzing(true);
    setAnalysisResult("");
    setAnalysisCitations([]);

    try {
      const res = await fetch("/api/contradictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: params.id, documentIds: selectedDocs }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Contradiction analysis failed");

      setAnalysisResult(data.analysis);
      setAnalysisCitations(data.sources || []);
    } catch (err) {
      console.error(err);
      alert("Contradiction analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to render text with interactive citations
  const renderContentWithCitations = (content: any): React.ReactNode => {
    if (typeof content === 'string') {
      const parts = content.split(/(\[Source: "[^"]+", Page: \d+\])/g);
      return parts.map((part, i) => {
        const match = part.match(/\[Source: "([^"]+)", Page: (\d+)\]/);
        if (match) {
          const [full, fileName, page] = match;
          const citation = analysisCitations.find(c => 
            c.file_name === fileName && c.page === parseInt(page)
          );

          return (
            <span key={i} className="group relative inline-block">
              <span className="cursor-help font-bold text-primary underline decoration-dotted underline-offset-4 hover:text-primary/80 transition-colors">
                {full}
              </span>
              {citation && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-80 -translate-x-1/2 rounded-xl bg-card p-4 text-xs leading-relaxed text-card-foreground shadow-2xl border border-primary/20 opacity-0 transition-all group-hover:opacity-100 z-[100] translate-y-2 group-hover:translate-y-0">
                  <span className="block font-bold mb-2 border-b border-primary/10 pb-1 flex justify-between uppercase tracking-tighter text-primary">
                    <span>Source Verification</span>
                    <span className="opacity-50">Page {page}</span>
                  </span>
                  <span className="italic text-muted-foreground block mb-3 font-serif line-clamp-6 leading-normal">
                    "...{citation.content.replace(/\[Page: \d+\]/, "").trim()}..."
                  </span>
                  <span className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <FileText className="h-3 w-3" /> {fileName}
                  </span>
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-card"></span>
                </span>
              )}
            </span>
          );
        }
        return part;
      });
    }
    
    if (Array.isArray(content)) {
      return content.map((child, i) => <React.Fragment key={i}>{renderContentWithCitations(child)}</React.Fragment>);
    }

    if (content?.props?.children) {
        return React.cloneElement(content, {
            children: renderContentWithCitations(content.props.children)
        });
    }

    return content;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !caseData) return;

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    for (const file of Array.from(files)) {
      try {
        console.log(`🚀 Starting Batch Upload for: ${file.name}`);
        
        // 1. Upload to Supabase Storage
        const filePath = `${user!.id}/${params.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("case-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Add record to Database
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

        // 3. Trigger the Anatruth Digest
        fetch("/api/digest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: docRecord.id })
        }).then(res => {
          if (res.ok) {
            setDocuments(prev => prev.map(d => 
              d.id === docRecord.id ? { ...d, metadata: { status: "ready" } } : d
            ));
          }
        });

      } catch (err) {
        console.error(`Upload Error (${file.name}):`, err);
      }
    }
    
    setIsUploading(false);
  };

  if (!caseData) return <div className="p-20 text-center">Loading Investigation...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl" suppressHydrationWarning>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{caseData.name}</h1>
          <p className="text-muted-foreground uppercase text-xs tracking-widest font-semibold">Investigation Room</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Document Manager */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Source Files
                <label className="cursor-pointer hover:text-primary transition-colors">
                  <Upload className="h-5 w-5" />
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} multiple />
                </label>
              </CardTitle>
              <CardDescription>Upload PDFs or text files for forensic review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isUploading && (
                <div className="flex items-center gap-2 p-3 text-sm text-primary animate-pulse bg-primary/5 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing New Entry...
                </div>
              )}
              {documents.length === 0 && !isUploading ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-md">
                  No documents found.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50 text-sm border hover:border-primary/30 transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={selectedDocs.includes(doc.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDocs(prev => [...prev, doc.id]);
                        else setSelectedDocs(prev => prev.filter(id => id !== doc.id));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <FileText className="h-4 w-4 text-primary opacity-60" />
                    <span className="truncate flex-1 font-medium">{doc.file_name}</span>
                    <div className="flex items-center gap-2">
                      {doc.metadata?.status === "ready" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                      )}
                      <button onClick={() => handleDelete(doc.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              {documents.some(d => d.metadata?.status === "indexing") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs text-muted-foreground hover:text-destructive mt-2"
                  onClick={clearStuckUploads}
                >
                  Clear stuck uploads
                </Button>
              )}
            </CardContent>
          </Card>

          <Button 
            className="w-full h-12 text-lg font-bold italic" 
            disabled={documents.length === 0 || isUploading || isAnalyzing}
            onClick={handleAnalysis}
          >
            {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
            {isAnalyzing ? "Analyzing..." : "Run Anatruth Engine"}
          </Button>

          <Button 
            variant="outline"
            className="w-full h-12 text-lg font-bold italic border-primary/30 hover:bg-primary/5" 
            disabled={selectedDocs.length < 2 || isUploading || isAnalyzing}
            onClick={handleContradictionAnalysis}
          >
            {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
            {isAnalyzing ? "Comparing..." : `Contradiction Engine (${selectedDocs.length})`}
          </Button>
        </div>

        {/* Right: Intelligence Console */}
        <div className="md:col-span-2 space-y-6">
          <Card className="min-h-[600px] flex flex-col">
            <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Intelligence Console</CardTitle>
                <CardDescription>Cross-reference findings and forensic results.</CardDescription>
              </div>
              {analysisResult && (
                <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-6 flex flex-col overflow-visible">
              {!analysisResult && !isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
                  <ShieldCheck className="h-16 w-16 mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground max-w-sm">
                    Upload documents and click "Run Anatruth Engine" to begin the deep forensic cross-referencing process.
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  {isAnalyzing && (
                     <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Reading documents...</p>
                     </div>
                  )}
                  {analysisResult && (
                    <div ref={reportRef} className="p-4 print:p-8">
                      {/* Print Only Header */}
                      <div className="hidden print:block mb-8 border-b-2 border-primary pb-4 text-center">
                        <h1 className="text-3xl font-bold italic tracking-tighter">SPECTRE INTEL</h1>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Official Forensic Analysis Report</p>
                        <div className="mt-4 flex justify-between text-[10px] text-muted-foreground">
                          <span>Case: {caseData.name}</span>
                          <span>Generated: {new Date().toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="prose prose-sm dark:prose-invert max-w-none print:text-black">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <p>{renderContentWithCitations(children)}</p>,
                            li: ({ children }) => <li>{renderContentWithCitations(children)}</li>,
                            h1: ({ children }) => <h1>{renderContentWithCitations(children)}</h1>,
                            h2: ({ children }) => <h2>{renderContentWithCitations(children)}</h2>,
                            h3: ({ children }) => <h3>{renderContentWithCitations(children)}</h3>,
                            td: ({ children }) => <td>{renderContentWithCitations(children)}</td>,
                            th: ({ children }) => <th>{renderContentWithCitations(children)}</th>,
                          }}
                        >
                          {analysisResult}
                        </ReactMarkdown>
                      </div>

                      {/* Print Only Footer */}
                      <div className="hidden print:block mt-12 pt-4 border-t border-muted text-[8px] text-center text-muted-foreground uppercase tracking-widest">
                        This document is a computer-generated forensic analysis. Verify all citations manually.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4 bg-muted/10 flex flex-col items-start gap-2">
               <div className="w-full">
                  <div className="flex items-center space-x-2 pb-1">
                    <input 
                      type="checkbox" 
                      id="generalKnowledge" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                      checked={useGeneralKnowledge} 
                      onChange={(e) => setUseGeneralKnowledge(e.target.checked)} 
                      disabled={isAnalyzing}
                    />
                    <label htmlFor="generalKnowledge" className="text-xs font-medium leading-none cursor-pointer">
                      Enable General Knowledge Fallback
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3 pl-6">
                    Warning: Allows AI to use outside data if context is missing. Results may not be forensically verified.
                  </p>
               </div>
               <div className="w-full flex gap-2">
                 <input 
                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                   placeholder="Ask a specific question about the evidence..."
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   disabled={isAnalyzing}
                 />
                 <Button onClick={handleAnalysis} disabled={isAnalyzing}>Ask</Button>
               </div>
               <div className="mt-2 text-right">
                 <button 
                   onClick={async () => {
                     const res = await fetch("/api/debug");
                     const data = await res.json();
                     alert(JSON.stringify(data, null, 2));
                   }}
                   className="text-[10px] text-muted-foreground underline hover:text-primary"
                 >
                   Debug Data
                 </button>
               </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

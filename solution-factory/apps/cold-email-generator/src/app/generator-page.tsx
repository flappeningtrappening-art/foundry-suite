"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Upload, FileText, Play, CheckCircle2, Loader2, List, Trash2, Search, Download, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useReactToPrint } from "react-to-print";

function Alert({ title, message }: { title: string; message: string }) {
  return (
    <div
      className="bg-destructive/10 border border-destructive/50 text-destructive dark:border-destructive/80 rounded-lg p-4"
      role="alert"
    >
      <h5 className="font-bold">{title}</h5>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function GeneratorPage({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [formData, setFormData] = useState({
    recipientInfo: "",
    myProduct: "",
    valueProp: "",
    cta: "",
    tone: "Professional & Direct",
  });
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [analysisCitations, setAnalysisCitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [styles, setStyles] = useState<any[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>("");

  // Forensic State
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Bulk Mode State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState({
    recipient: "",
    company: "",
    valueProp: ""
  });
  const [bulkResults, setBulkResults] = useState<{ recipient: string; emailText: string; status: "pending" | "processing" | "completed" | "error" }[]>([]);
  const [currentBulkIndex, setCurrentBulkIndex] = useState(-1);

  const supabase = createClient();
  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `FOUNDRY_OUTREACH_DRAFT_${new Date().getTime()}`,
  });

  useEffect(() => {
    async function loadStyles() {
      if (user) {
        const { data } = await supabase.from("voice_profiles").select("*");
        setStyles(data || []);
      }
    }
    loadStyles();
  }, [user]);

  // Handle Document Polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadDocuments = async () => {
    const { data } = await supabase
      .from("case_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocuments(data || []);
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setGeneratedEmail("");
    setAnalysisCitations([]);
    setError(null);
    setIsQuotaExceeded(false);

    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          styleId: selectedStyleId,
          documentIds: documents.map(d => d.id) 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.isQuotaExceeded) setIsQuotaExceeded(true);
        throw new Error(data.error || "Something went wrong.");
      }
      setGeneratedEmail(data.email);
      setAnalysisCitations(data.sources || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const filePath = `${user.id}/outreach/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("case-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: docRecord, error: dbError } = await supabase
        .from("case_documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          storage_path: filePath,
          metadata: { status: "indexing", source: "outreach" }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docRecord.id })
      });

      await loadDocuments();
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/document/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: id })
    });
    await loadDocuments();
  };

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center py-20">
        <h1 className="text-4xl font-bold mb-4">FOUNDRY OUTREACH</h1>
        <p className="mb-6">Log in to deploy personalized outreach at scale.</p>
        <Button asChild><Link href="/login">Log In</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full p-4 md:p-8 max-w-7xl mx-auto" suppressHydrationWarning>
      <div className="flex items-center justify-between w-full mb-8">
        <div>
          <h1 className="text-4xl font-bold italic tracking-tighter">FOUNDRY OUTREACH</h1>
          <p className="text-muted-foreground uppercase text-xs tracking-widest font-semibold">Cold Email Ghostwriter</p>
        </div>
        <Button variant="ghost" asChild><Link href="/voice-lab"><Mic className="mr-2 h-4 w-4" /> Voice Lab</Link></Button>
      </div>

      <div className="w-full space-y-8">
        <div className="flex bg-muted p-1 rounded-lg w-fit mx-auto">
          <button onClick={() => setActiveTab("single")} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "single" ? "bg-background shadow-sm" : "hover:text-primary"}`}>Single Email</button>
          <button onClick={() => setActiveTab("bulk")} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "bulk" ? "bg-background shadow-sm" : "hover:text-primary"}`}>Bulk Mode (CSV)</button>
        </div>

        {activeTab === "single" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            <div className="lg:col-span-1 space-y-6">
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader><CardTitle>Draft an Email</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="style">Writing Voice</Label>
                      <select id="style" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={selectedStyleId} onChange={(e) => setSelectedStyleId(e.target.value)}>
                        <option value="">Default AI Voice</option>
                        {styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="recipientInfo">Recipient Info</Label>
                      <Input id="recipientInfo" placeholder="e.g. CEO of Acme Corp" value={formData.recipientInfo} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="myProduct">Your Product</Label>
                        <Input id="myProduct" placeholder="AI Chatbots" value={formData.myProduct} onChange={handleInputChange} />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="cta">Action (CTA)</Label>
                        <Input id="cta" placeholder="15-min call" value={formData.cta} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="valueProp">Value Proposition</Label>
                      <Textarea id="valueProp" placeholder="We save time..." value={formData.valueProp} onChange={handleInputChange} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading || !formData.recipientInfo || isQuotaExceeded}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                      {isLoading ? "Drafting..." : "Generate Email"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Forensic Context
                    <label className="cursor-pointer hover:text-primary transition-colors">
                      <Upload className="h-5 w-5" />
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </CardTitle>
                  <CardDescription>Upload Annual Reports or Case Studies to ground your outreach in truth.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isUploading && <div className="p-3 text-xs animate-pulse bg-primary/5 rounded-md"><Loader2 className="inline mr-2 h-3 w-3 animate-spin" /> Uploading...</div>}
                  {documents.length === 0 && !isUploading ? (
                    <div className="text-center py-8 text-muted-foreground text-xs border-2 border-dashed rounded-md">No forensic docs found.</div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-[10px] border group">
                        <FileText className="h-3 w-3 text-primary opacity-60" />
                        <span className="truncate flex-1 font-medium">{doc.file_name}</span>
                        {doc.metadata?.status === "ready" ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />}
                        <button onClick={() => handleDeleteDoc(doc.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="min-h-[600px] flex flex-col overflow-visible">
                <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Outreach Intelligence</CardTitle>
                    <CardDescription>Verified, personalized, and forensically-grounded.</CardDescription>
                  </div>
                  {generatedEmail && (
                    <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                      <Download className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-6 flex flex-col overflow-visible">
                  {!generatedEmail && !isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
                      <ShieldCheck className="h-16 w-16 mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground max-w-sm italic text-sm">
                        Upload target company reports and hit "Generate Email" to create a forensically-verified outreach draft.
                      </p>
                    </div>
                  ) : (
                    <div ref={reportRef} className="p-4 print:p-8">
                      <div className="hidden print:block mb-8 border-b-2 border-primary pb-4 text-center">
                        <h1 className="text-3xl font-bold italic tracking-tighter">FOUNDRY OUTREACH</h1>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Verified Sales Intelligence Report</p>
                      </div>

                      <div className="prose prose-sm dark:prose-invert max-w-none print:text-black">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{
                          p: ({ children }) => <p>{renderContentWithCitations(children)}</p>,
                          li: ({ children }) => <li>{renderContentWithCitations(children)}</li>,
                          h1: ({ children }) => <h1>{renderContentWithCitations(children)}</h1>,
                          h2: ({ children }) => <h2>{renderContentWithCitations(children)}</h2>,
                          h3: ({ children }) => <h3>{renderContentWithCitations(children)}</h3>,
                        }}>
                          {generatedEmail}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bulk Mode logic... same as before but can be upgraded too */}
            <Card className="h-fit">
              <CardHeader><CardTitle>Bulk Setup</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>1. Upload CSV</Label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/5 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload CSV</p>
                    </div>
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                  </label>
                </div>
                {/* ... Rest of bulk UI ... */}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

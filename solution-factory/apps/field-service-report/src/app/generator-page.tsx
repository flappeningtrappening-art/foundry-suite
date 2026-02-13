"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Upload, FileText, Play, CheckCircle2, Loader2, List, Trash2, Search, Download, ShieldCheck, Camera, Plus, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";

export default function FieldServiceDashboard({ user }: { user: any }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user) loadJobs();
  }, [user]);

  const loadJobs = async () => {
    const { data } = await supabase.from("field_jobs").select("*").order("created_at", { ascending: false });
    setJobs(data || []);
    setIsLoading(false);
  };

  const createNewJob = async () => {
    const name = prompt("Enter Client Name / Job ID:");
    if (!name) return;
    setIsCreating(true);
    const { data } = await supabase.from("field_jobs").insert({ 
        user_id: user.id, 
        client_name: name,
        status: "in-progress" 
    }).select().single();
    if (data) {
        setJobs([data, ...jobs]);
        setActiveJob(data);
    }
    setIsCreating(false);
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Initializing FOUNDRY FIELD...</div>;

  if (activeJob) {
    return <JobEditor job={activeJob} onBack={() => { setActiveJob(null); loadJobs(); }} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold italic tracking-tighter">FOUNDRY FIELD</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Mobile Reporting Suite</p>
        </div>
        <Button onClick={createNewJob} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" /> New Job
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {jobs.length === 0 ? (
          <Card className="border-dashed py-20 text-center opacity-50">
            <p>No active jobs. Tap "New Job" to begin.</p>
          </Card>
        ) : (
          jobs.map(job => (
            <Card key={job.id} onClick={() => setActiveJob(job)} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="py-4">
                <div className="flex justify-between">
                  <CardTitle className="text-lg">{job.client_name}</CardTitle>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${job.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {job.status}
                  </span>
                </div>
                <CardDescription>{new Date(job.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function JobEditor({ job, onBack }: { job: any, onBack: () => void }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `FIELD_REPORT_${job.client_name}`,
  });

  useEffect(() => {
    loadEntries();
  }, [job.id]);

  const loadEntries = async () => {
    const { data } = await supabase.from("job_entries").select("*").eq("job_id", job.id).order("created_at", { ascending: true });
    setEntries(data || []);
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const path = `${user!.id}/jobs/${job.id}/${Date.now()}-${file.name}`;
        await supabase.storage.from("field-photos").upload(path, file);
        
        await supabase.from("job_entries").insert({
            job_id: job.id,
            user_id: user!.id,
            photo_path: path,
            notes: "Initial capture..."
        });
        loadEntries();
    } catch (err) {
        console.error(err);
    } finally {
        setIsUploading(false);
    }
  };

  const updateNotes = async (entryId: string, notes: string) => {
    await supabase.from("job_entries").update({ notes }).eq("id", entryId);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-xl font-bold">{job.client_name}</h2>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => handlePrint()}>
            <Send className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <div className="space-y-4">
        {entries.map(entry => (
          <Card key={entry.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
                <img 
                    src={supabase.storage.from("field-photos").getPublicUrl(entry.photo_path).data.publicUrl} 
                    className="w-full h-full object-cover"
                />
            </div>
            <CardContent className="p-4">
                <Textarea 
                    defaultValue={entry.notes} 
                    onBlur={(e) => updateNotes(entry.id, e.target.value)}
                    placeholder="Add field notes..."
                    className="border-none shadow-none focus-visible:ring-0 p-0 text-sm"
                />
            </CardContent>
          </Card>
        ))}

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium text-muted-foreground">Capture Observation</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} disabled={isUploading} />
        </label>
      </div>

      {/* Hidden Print Template */}
      <div className="hidden">
        <div ref={printRef} className="p-12 space-y-8">
            <div className="text-center border-b pb-4">
                <h1 className="text-4xl font-bold italic">FOUNDRY FIELD REPORT</h1>
                <p className="text-sm uppercase tracking-widest text-muted-foreground">Professional Site Verification</p>
            </div>
            <div className="flex justify-between text-sm">
                <span><strong>Client:</strong> {job.client_name}</span>
                <span><strong>Date:</strong> {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            {entries.map(entry => (
                <div key={entry.id} className="space-y-4 break-inside-avoid">
                    <img src={supabase.storage.from("field-photos").getPublicUrl(entry.photo_path).data.publicUrl} className="w-full h-auto rounded-lg max-h-96 object-contain bg-gray-50" />
                    <p className="text-sm border-l-4 pl-4 py-2 bg-gray-50">{entry.notes}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

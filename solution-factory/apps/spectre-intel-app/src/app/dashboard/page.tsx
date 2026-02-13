"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Plus, FileText, ChevronRight, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadCases() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("analysis_cases")
        .select("*")
        .order("created_at", { ascending: false });
      
      setCases(data || []);
      setLoading(false);
    }
    loadCases();
  }, []);

  const createNewCase = async () => {
    const name = prompt("Enter a name for this investigation:");
    if (!name) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("analysis_cases")
      .insert({ name, user_id: user!.id })
      .select()
      .single();

    if (error) alert("Failed to create case.");
    else setCases([data, ...cases]);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse uppercase tracking-widest text-xs font-bold">Initializing Spectre Intel...</p>
    </div>
  );

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter italic">SPECTRE INTEL</h1>
          <p className="text-muted-foreground uppercase text-xs tracking-widest font-semibold mt-1">Forensic Intelligence Command</p>
        </div>
        <Button onClick={createNewCase} className="font-bold italic">
          <Plus className="mr-2 h-4 w-4" /> New Investigation
        </Button>
      </div>

      {cases.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20 opacity-50">
            <ShieldAlert className="h-16 w-16 mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No Active Investigations</p>
            <p className="text-sm text-muted-foreground">Launch a new case to begin forensic auditing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <Link key={c.id} href={`/case/${c.id}`} className="block group">
              <Card className="hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="mt-4 text-xl group-hover:text-primary transition-colors">{c.name}</CardTitle>
                  <CardDescription className="text-xs uppercase tracking-tight">
                    Case ID: {c.id.slice(0, 8)} | Opened: {new Date(c.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Ready for Analysis
                   </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FolderOpen, ShieldCheck, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function IntelDashboard() {
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [newCaseName, setNewStyleName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("analysis_cases")
          .select("*")
          .order("created_at", { ascending: false });
        setCases(data || []);
      }
      setIsLoading(false);
    }
    loadData();
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
      setNewStyleName("");
    }
  }

  if (isLoading) return <div className="p-20 text-center">Initializing SPECTRE INTEL...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <ShieldCheck className="h-16 w-16 mb-6 text-primary opacity-20" />
        <h1 className="text-4xl font-bold mb-4 tracking-tighter italic">SPECTRE INTEL</h1>
        <p className="text-muted-foreground mb-8 max-w-md uppercase text-xs tracking-widest font-semibold">
          High-Stakes Forensic Intelligence. Authorize access to continue.
        </p>
        <Button asChild className="px-8"><Link href="/login">Authorize Access</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold italic tracking-tighter">SPECTRE INTEL</h1>
          <p className="text-muted-foreground uppercase text-xs tracking-widest font-semibold">Forensic Investigation Hub</p>
        </div>
        <Button variant="outline" asChild><Link href="/">Logout</Link></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar: Create New Case */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">New Investigation</CardTitle>
              <CardDescription>Initiate a new forensic analysis case.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caseName">Case Name</Label>
                <Input 
                  id="caseName"
                  placeholder="e.g. Q4 Financial Discrepancy" 
                  value={newCaseName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={createCase}>
                <Plus className="mr-2 h-4 w-4" /> Start Case
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Intelligence Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Investigations</span>
                <span className="font-mono font-bold">{cases.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">"Truth Flags" Found</span>
                <span className="font-mono font-bold text-green-500">0</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main: Investigations List */}
        <div className="md:col-span-2">
          <h3 className="font-semibold text-xl mb-6 flex items-center">
            <FolderOpen className="mr-2 h-5 w-5 text-primary" /> Active Investigations
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5">
                <p>No active cases. Start one to begin forensic analysis.</p>
              </div>
            ) : (
              cases.map((item) => (
                <Card key={item.id} className="hover:border-primary/50 transition-colors group cursor-pointer">
                  <Link href={`/case/${item.id}`} className="block">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-1">{item.name}</CardTitle>
                          <CardDescription>Created: {new Date(item.created_at).toLocaleDateString()}</CardDescription>
                        </div>
                        <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 border-t-0 flex gap-4">
                      <span className="text-xs flex items-center text-muted-foreground"><FileText className="mr-1 h-3 w-3" /> 0 Documents</span>
                      <span className="text-xs flex items-center text-muted-foreground"><AlertTriangle className="mr-1 h-3 w-3" /> 0 Discrepancies</span>
                    </CardFooter>
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

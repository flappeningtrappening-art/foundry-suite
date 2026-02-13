"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Mic } from "lucide-react";
import Link from "next/link";

export default function VoiceLabPage() {
  const [user, setUser] = useState<any>(null);
  const [styles, setStyles] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [newStyleName, setNewStyleName] = useState("");
  const [newSampleContent, setNewSampleContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: stylesData } = await supabase
          .from("voice_profiles")
          .select("*")
          .order("created_at", { ascending: false });
        setStyles(stylesData || []);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStyle) {
      loadSamples(selectedStyle.id);
    }
  }, [selectedStyle]);

  async function loadSamples(profileId: string) {
    const { data } = await supabase
      .from("voice_samples")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });
    setSamples(data || []);
  }

  async function createStyle() {
    if (!newStyleName) return;
    try {
      const { data, error } = await supabase
        .from("voice_profiles")
        .insert({ name: newStyleName, user_id: user.id })
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error creating style:", error);
        alert(`Failed to create style: ${error.message}`);
        return;
      }

      if (data) {
        setStyles([data, ...styles]);
        setSelectedStyle(data);
        setNewStyleName("");
      }
    } catch (err: any) {
      console.error("Runtime error creating style:", err);
      alert("An unexpected error occurred.");
    }
  }

  async function addSample() {
    if (!newSampleContent || !selectedStyle) return;
    try {
      const { data, error } = await supabase
        .from("voice_samples")
        .insert({
          profile_id: selectedStyle.id,
          user_id: user.id,
          content: newSampleContent
        })
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error adding sample:", error);
        alert(`Failed to add sample: ${error.message}`);
        return;
      }

      if (data) {
        setSamples([...samples, data]);
        setNewSampleContent("");
      }
    } catch (err: any) {
      console.error("Runtime error adding sample:", err);
      alert("An unexpected error occurred.");
    }
  }

  async function deleteSample(id: string) {
    await supabase.from("voice_samples").delete().eq("id", id);
    setSamples(samples.filter(s => s.id !== id));
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading Voice Lab...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-3xl font-bold mb-4">Welcome to The Voice Lab</h1>
        <p className="text-muted-foreground mb-6">Train your AI models to write exactly like you. Please log in to continue.</p>
        <Button asChild><Link href="/login">Log In</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">The Voice Lab</h1>
          <p className="text-muted-foreground">Digital Ghostwriting Training Center</p>
        </div>
        <Button variant="outline" asChild><Link href="/">Back to Generator</Link></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar: Styles List */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Voice Profiles</CardTitle>
              <CardDescription>Select or create a new style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Style Name" 
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                />
                <Button size="icon" onClick={createStyle}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedStyle?.id === style.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main: Style Training */}
        <div className="md:col-span-2">
          {selectedStyle ? (
            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Training: {selectedStyle.name}</CardTitle>
                  <CardDescription>
                    Add 3-5 high-quality samples of your writing. The AI will study the cadence, vocabulary, and rhythm.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Writing Sample</Label>
                    <Textarea 
                      placeholder="Paste a successful tweet, email, or listing here..." 
                      className="h-32"
                      value={newSampleContent}
                      onChange={(e) => setNewSampleContent(e.target.value)}
                    />
                  </div>
                  <Button onClick={addSample} className="w-full">
                    <Save className="mr-2 h-4 w-4" /> Save Sample to Profile
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center">
                  <Mic className="mr-2 h-5 w-5 text-primary" /> Learned Samples ({samples.length})
                </h3>
                {samples.map((sample) => (
                  <Card key={sample.id} className="relative group">
                    <CardContent className="pt-6 pr-12 text-sm text-muted-foreground italic">
                      "{sample.content}"
                    </CardContent>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSample(sample.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5">
              <p>Select or create a voice profile to start training.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

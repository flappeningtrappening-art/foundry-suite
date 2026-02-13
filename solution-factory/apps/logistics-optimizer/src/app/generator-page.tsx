"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Play, Trash2, Upload, FileText, CheckCircle2, Loader2, List, Download, Plus } from "lucide-react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Papa from "papaparse";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function LogisticsDashboard({ user }: { user: any }) {
  const [stops, setStops] = useState<any[]>([]);
  const [newStop, setNewStop] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const mapContainer = useRef<any>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.006, 40.7128], // Default NYC
      zoom: 12,
    });

    map.current.on("load", () => {
        // Add source for route line
        map.current?.addSource("route", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: []
                }
            }
        });

        map.current?.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#3b82f6", "line-width": 4, "line-opacity": 0.75 }
        });
    });
  }, []);

  const addStop = async () => {
    if (!newStop) return;
    
    // Geocode address via Mapbox
    try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(newStop)}.json?access_token=${mapboxgl.accessToken}`);
        const data = await res.json();
        const center = data.features[0]?.center;
        
        if (center) {
            const stop = { id: Date.now(), address: newStop, lng: center[0], lat: center[1] };
            setStops([...stops, stop]);
            setNewStop("");
            
            // Add marker to map
            const marker = new mapboxgl.Marker({ color: "#3b82f6" })
                .setLngLat(center)
                .setPopup(new mapboxgl.Popup().setHTML(`<p class="text-xs font-bold">${newStop}</p>`))
                .addTo(map.current!);
            markers.current.push(marker);
            
            // Fit map
            const bounds = new mapboxgl.LngLatBounds();
            [...stops, stop].forEach(s => bounds.extend([s.lng, s.lat]));
            map.current?.fitBounds(bounds, { padding: 50 });
        }
    } catch (err) {
        console.error("Geocoding failed", err);
    }
  };

  const clearStops = () => {
    setStops([]);
    markers.current.forEach(m => m.remove());
    markers.current = [];
    setOptimizedRoute(null);
    if (map.current?.getSource("route")) {
        (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
            type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] }
        });
    }
  };

  const optimizeRoute = async () => {
    if (stops.length < 2) return;
    setIsOptimizing(true);
    
    // Call Mapbox Optimization API
    const coords = stops.map(s => `${s.lng},${s.lat}`).join(";");
    try {
        const res = await fetch(`https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?access_token=${mapboxgl.accessToken}&geometries=geojson&overview=full`);
        const data = await res.json();
        
        if (data.trips && data.trips[0]) {
            const trip = data.trips[0];
            setOptimizedRoute(trip);
            
            // Update line on map
            if (map.current?.getSource("route")) {
                (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData(trip.geometry);
            }
            
            // Re-order stops in list based on optimized sequence
            const newOrder = data.waypoints.sort((a: any, b: any) => a.waypoint_index - b.waypoint_index);
            const orderedStops = newOrder.map((w: any) => stops[w.location_index]);
            setStops(orderedStops);
        }
    } catch (err) {
        console.error("Optimization failed", err);
    } finally {
        setIsOptimizing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // For simplicity, assume first column is address
                const field = results.meta.fields?.[0];
                if (field) {
                    results.data.forEach((row: any) => {
                        // We would ideally batch geocode here
                        // For prototype, we'll just add the first few
                        console.log("Bulk adding:", row[field]);
                    });
                    alert("Bulk addresses parsed. In a production environment, we would batch geocode these now.");
                }
            },
        });
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center py-20">
        <h1 className="text-4xl font-bold mb-4">FOUNDRY LOGISTICS</h1>
        <p className="mb-6">Log in to optimize your delivery network.</p>
        <Button asChild><Link href="/login">Log In</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <Navigation className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold italic tracking-tighter">FOUNDRY LOGISTICS</h1>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" asChild><Link href="/">Logout</Link></Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Controls */}
        <div className="w-96 border-r flex flex-col bg-muted/5 p-6 space-y-6 overflow-y-auto shrink-0">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm">Manage Stops</CardTitle>
                    <CardDescription>Add delivery addresses manually or via CSV.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">New Address</Label>
                        <div className="flex gap-2">
                            <Input id="address" placeholder="e.g. 123 Main St" value={newStop} onChange={(e) => setNewStop(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStop()} />
                            <Button size="icon" onClick={addStop}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-bold">OR</span></div>
                    </div>
                    <label className="flex items-center justify-center w-full h-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-xs font-bold text-muted-foreground">Upload CSV</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                </CardContent>
            </Card>

            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Route ({stops.length} stops)</h3>
                    <Button variant="ghost" size="sm" onClick={clearStops} className="h-6 text-[10px] uppercase font-bold text-destructive">Clear All</Button>
                </div>
                <div className="space-y-2">
                    {stops.map((stop, i) => (
                        <div key={stop.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg text-sm group">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                {i + 1}
                            </div>
                            <span className="truncate flex-1">{stop.address}</span>
                            <MapPin className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t space-y-4">
                {optimizedRoute && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100 space-y-1">
                        <p className="text-[10px] font-bold text-green-600 uppercase">Optimization Stats</p>
                        <p className="text-sm font-bold">Distance: {(optimizedRoute.distance / 1609.34).toFixed(1)} miles</p>
                        <p className="text-sm font-bold">Time: {(optimizedRoute.duration / 60).toFixed(0)} mins</p>
                    </div>
                )}
                <Button className="w-full h-12 text-lg font-bold italic" disabled={stops.length < 2 || isOptimizing} onClick={optimizeRoute}>
                    {isOptimizing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                    {isOptimizing ? "Optimizing..." : "Calculate Best Path"}
                </Button>
            </div>
        </div>

        {/* Right: The Map */}
        <div ref={mapContainer} className="flex-1 bg-muted relative">
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button variant="secondary" size="sm" className="shadow-md bg-white/90 backdrop-blur-sm">
                    <Navigation className="mr-2 h-4 w-4" /> Real-time Sync
                </Button>
            </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { createClient } from "@supabase/supabase-js";
import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Map, { type MapRef } from "react-map-gl/mapbox";

const FALLBACK = { lat: 35.681236, lng: 139.767125 };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function RoomPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();

  const minutesParam = Number(searchParams.get("minutes") ?? "60");
  const expiresParam = searchParams.get("expires") ?? "";

  const expiresAt = useMemo(() => {
    const decoded = expiresParam ? decodeURIComponent(expiresParam) : "";
    const d = decoded ? new Date(decoded) : null;
    if (d && !isNaN(d.getTime())) return d;
    return new Date(Date.now() + minutesParam * 60 * 1000);
  }, [expiresParam, minutesParam]);

  const initialExpired = expiresAt.getTime() <= Date.now();

  const [leftSec, setLeftSec] = useState(0);
  const [expired, setExpired] = useState(initialExpired);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<MapRef>(null);
  const myMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const otherMarkersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const userIdRef = useRef<string>(crypto.randomUUID());

  // countdown
  useEffect(() => {
    if (expired) return;
    const tick = () => {
      const s = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      setLeftSec(s);
      if (s <= 0) setExpired(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, expired]);

  // location watch
  useEffect(() => {
    if (expired) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [expired]);

  // camera follow
  useEffect(() => {
    if (!pos || !mapRef.current) return;
    mapRef.current.easeTo({ center: [pos.lng, pos.lat], zoom: 15, duration: 500 });
  }, [pos]);

  // my marker
  useEffect(() => {
    if (!pos || !mapRef.current) return;
    const map = mapRef.current.getMap();

    if (!myMarkerRef.current) {
      const el = document.createElement("div");
      el.style.width = "26px";
      el.style.height = "26px";
      el.style.borderRadius = "999px";
      el.style.background = "#22c55e";
      el.style.border = "5px solid white";
      el.style.boxShadow = "0 10px 28px rgba(0,0,0,0.65)";

      myMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([pos.lng, pos.lat])
        .addTo(map);
    } else {
      myMarkerRef.current.setLngLat([pos.lng, pos.lat]);
    }
  }, [pos]);

  // upsert my location (every 2s)
  useEffect(() => {
    if (expired || !pos) return;

    const userId = userIdRef.current;
    const upsertOnce = async () => {
      await supabase.from("locations").upsert({
        room_id: roomId,
        user_id: userId,
        lat: pos.lat,
        lng: pos.lng,
        updated_at: new Date().toISOString(),
      });
    };

    upsertOnce();
    const id = setInterval(upsertOnce, 2000);
    return () => clearInterval(id);
  }, [expired, pos, roomId]);

  // realtime subscribe: show other users
  useEffect(() => {
    if (expired || !roomId || !mapRef.current) return;

    const map = mapRef.current.getMap();
    const myUserId = userIdRef.current;

    const ensureOtherMarker = (userId: string, lng: number, lat: number) => {
      if (userId === myUserId) return;

      const existing = otherMarkersRef.current[userId];
      if (existing) return void existing.setLngLat([lng, lat]);

      const el = document.createElement("div");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "999px";
      el.style.background = "#3b82f6";
      el.style.border = "4px solid white";
      el.style.boxShadow = "0 10px 24px rgba(0,0,0,0.55)";

      otherMarkersRef.current[userId] = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    };

    const removeOtherMarker = (userId: string) => {
      const mk = otherMarkersRef.current[userId];
      if (!mk) return;
      mk.remove();
      delete otherMarkersRef.current[userId];
    };

    // initial fetch
    (async () => {
      const { data } = await supabase
        .from("locations")
        .select("user_id, lat, lng")
        .eq("room_id", roomId);
      if (!data) return;
      for (const row of data) ensureOtherMarker(row.user_id, row.lng, row.lat);
    })();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow: any = payload.old;
            if (oldRow?.user_id) removeOtherMarker(oldRow.user_id);
            return;
          }
          const row: any = payload.new;
          if (!row?.user_id) return;
          if (typeof row.lng !== "number" || typeof row.lat !== "number") return;
          ensureOtherMarker(row.user_id, row.lng, row.lat);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      Object.values(otherMarkersRef.current).forEach((m) => m.remove());
      otherMarkersRef.current = {};
    };
  }, [expired, roomId]);

  // expire → fade → top
  useEffect(() => {
    if (!expired) return;
    myMarkerRef.current?.remove();
    myMarkerRef.current = null;
    Object.values(otherMarkersRef.current).forEach((m) => m.remove());
    otherMarkersRef.current = {};
    const t = setTimeout(() => router.replace("/"), 1200);
    return () => clearTimeout(t);
  }, [expired, router]);

  // reopened after expiry → top
  useEffect(() => {
    if (!initialExpired) return;
    router.replace("/");
  }, [initialExpired, router]);

  if (initialExpired) return null;

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          padding: "6px 14px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          color: "white",
          fontSize: 16,
          fontWeight: 600,
          pointerEvents: "none",
        }}
      >
        {formatMMSS(leftSec)}
      </div>

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ latitude: FALLBACK.lat, longitude: FALLBACK.lng, zoom: 11 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
      />

      {expired && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "black",
            animation: "fade 1.2s ease forwards",
            zIndex: 100,
          }}
        />
      )}

      <style jsx global>{`
        @keyframes fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    setLoading(true);

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: duration }),
    });

    const data = await res.json();

    // ルームページへ移動
    router.push(data.shareUrl);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Nowly</h1>
      <p>時間で溶ける、位置共有。</p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={() => setDuration(30)}>30分</button>
        <button onClick={() => setDuration(60)}>1時間</button>
        <button onClick={() => setDuration(180)}>3時間</button>
      </div>

      <button onClick={createRoom} disabled={loading} style={{ marginTop: 16 }}>
        {loading ? "作成中…" : "ルームを作る"}
      </button>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createRoom = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: duration }),
      });

      // handle non-OK
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error: ${res.status} ${res.statusText}${text ? ` / ${text}` : ""}`);
      }

      const data = (await res.json()) as { shareUrl?: string };

      if (!data?.shareUrl) {
        throw new Error("API response missing shareUrl");
      }

      router.push(data.shareUrl);
    } catch (e: any) {
      console.error(e);
      setError("ルーム作成に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const Btn = ({ label, value }: { label: string; value: number }) => (
    <button
      onClick={() => setDuration(value)}
      disabled={loading}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: duration === value ? "#111" : "#fff",
        color: duration === value ? "#fff" : "#111",
        fontWeight: 700,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 6 }}>Nowly</h1>
      <p style={{ marginTop: 0, color: "#555" }}>時間で溶ける、位置共有。</p>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Btn label="30分" value={30} />
        <Btn label="1時間" value={60} />
        <Btn label="3時間" value={180} />
      </div>

      <button
        onClick={createRoom}
        disabled={loading}
        style={{
          marginTop: 16,
          width: "100%",
          height: 48,
          borderRadius: 12,
          border: 0,
          background: loading ? "#888" : "#22c55e",
          color: "#fff",
          fontWeight: 900,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "作成中…" : "ルームを作る"}
      </button>

      {error && (
        <p style={{ marginTop: 12, color: "#b91c1c", fontWeight: 700 }}>{error}</p>
      )}

      <p style={{ marginTop: 18, fontSize: 12, color: "#777" }}>
        うまくいかない場合：ブラウザの開発者ツール Console にエラーが出ます。
      </p>
    </main>
  );
}
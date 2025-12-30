"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function IconZap(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={props.className}
    >
      <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z" />
    </svg>
  );
}

function IconLoader(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
      className={props.className}
    >
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  );
}

function IconUser(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={props.className}
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconCopy(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={props.className}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconShare(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={props.className}
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
    </svg>
  );
}

export default function Home() {
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const canShare = useMemo(
    () => typeof navigator !== "undefined" && typeof (navigator as any).share === "function",
    []
  );

  const timeOptions = [
    { label: "30分", value: 30 },
    { label: "1時間", value: 60 },
    { label: "3時間", value: 180 },
  ];

  // nickname: optional, persist locally
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nowly:nickname") ?? "";
      if (saved) setNickname(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("nowly:nickname", nickname);
    } catch {}
  }, [nickname]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const createRoom = async () => {
    // vibration (best-effort)
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    } catch {}

    setLoading(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: duration }),
      });

      if (!res.ok) throw new Error("作成失敗");

      const data = await res.json();

      // absolute URL for sharing
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const sharePath = String(data.shareUrl || "");
      const url = sharePath.startsWith("http")
        ? sharePath
        : `${origin}${sharePath.startsWith("/") ? "" : "/"}${sharePath}`;

      const withName = nickname
        ? `${url}${url.includes("?") ? "&" : "?"}name=${encodeURIComponent(nickname)}`
        : url;

      // copy (best-effort)
      try {
        await navigator.clipboard.writeText(withName);
        showToast("招待リンクをコピーしました");
      } catch {
        // ignore
      }

      // share sheet (best-effort)
      try {
        if ((navigator as any).share) {
          await (navigator as any).share({
            title: "Nowly",
            text: "いまどこ？（時間で溶ける位置共有）",
            url: withName,
          });
        }
      } catch {
        // user cancelled share etc.
      }

      router.push(sharePath);
    } catch (e) {
      console.error(e);
      showToast("作成に失敗しました");
      setLoading(false);
    }
  };

  const manualCopy = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/`;
      await navigator.clipboard.writeText(url);
      showToast("リンクをコピーしました");
    } catch {
      showToast("コピーできませんでした");
    }
  };

  return (
    <main className="h-[100dvh] w-full bg-[#08081A] text-white overflow-hidden relative touch-none select-none flex flex-col">
      {/* background glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-30%] w-[90vw] h-[90vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* toast */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl text-xs font-semibold">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pb-20">
        {/* logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative">
            <IconZap
              className="w-12 h-12 text-yellow-300 absolute -top-8 -right-6 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] animate-bounce"
              style={{ animationDuration: "3s" } as any}
            />
            <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              Nowly
            </h1>
          </div>
          <p className="text-blue-200/60 text-sm font-bold tracking-widest mt-2">LOCATION SHARE</p>
          <p className="text-[11px] text-gray-400/80 mt-3 font-medium">時間で溶ける、位置共有。</p>
        </div>

        {/* nickname */}
        <div className="w-full max-w-sm mb-6">
          <label className="block text-center text-xs text-gray-400 font-bold mb-3 tracking-widest opacity-70">
            ニックネーム（任意）
          </label>
          <div className="flex items-center gap-3 bg-[#0D0D25]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
            <IconUser className="w-5 h-5 text-blue-200/70" />
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="匿名でもOK"
              className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:text-gray-500"
              inputMode="text"
              autoComplete="nickname"
              maxLength={18}
            />
          </div>
        </div>

        {/* duration */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          <p className="text-center text-xs text-gray-400 font-bold mb-3 tracking-widest opacity-70">有効期限を選択</p>

          <div className="flex items-center justify-between bg-[#0D0D25]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 w-full shadow-2xl">
            {timeOptions.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  try {
                    if (navigator.vibrate) navigator.vibrate(10);
                  } catch {}
                  setDuration(item.value);
                }}
                className={`relative flex-1 py-3.5 text-center font-bold text-sm rounded-xl transition-all duration-200 ${
                  duration === item.value ? "text-white" : "text-gray-500 active:scale-95"
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {duration === item.value && (
                  <div className="absolute inset-0 bg-gray-700/50 rounded-xl border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="w-full max-w-sm mt-auto space-y-3">
          <button
            onClick={createRoom}
            disabled={loading}
            className={`w-full h-16 rounded-2xl font-black text-xl tracking-widest text-[#08081A] transition-all duration-150 flex items-center justify-center gap-2 relative overflow-hidden group ${
              loading
                ? "bg-gray-700 cursor-wait"
                : "bg-[#33E16F] active:scale-[0.97] active:bg-[#2bb556] shadow-[0_0_40px_rgba(51,225,111,0.4)]"
            }`}
          >
            {!loading && <div className="nowly-shimmer" />}
            {loading ? (
              <IconLoader className="animate-spin w-6 h-6 text-white" />
            ) : (
              <>
                <span>START</span>
                <IconZap className="w-5 h-5" />
              </>
            )}
          </button>

          {/* optional helper buttons */}
          <div className="flex gap-3">
            <button
              onClick={manualCopy}
              type="button"
              className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-xs font-bold tracking-widest text-white/80 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <IconCopy className="w-4 h-4" />
              COPY
            </button>
            <button
              onClick={() => {
                if (!canShare) {
                  showToast("この端末では共有が使えません");
                  return;
                }
                showToast("STARTで招待リンクが作られます");
              }}
              type="button"
              className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-xs font-bold tracking-widest text-white/80 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <IconShare className="w-4 h-4" />
              SHARE
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-500 mt-2 font-medium">リンクを知っている人だけが参加できます</p>
        </div>
      </div>

      <style jsx global>{`
        .nowly-shimmer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transform: translateX(-120%);
          animation: nowly_shimmer 1.6s infinite;
          pointer-events: none;
        }
        @keyframes nowly_shimmer {
          0% {
            transform: translateX(-120%);
          }
          60% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>
    </main>
  );
}
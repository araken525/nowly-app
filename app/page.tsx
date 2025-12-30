"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react"; // アイコン追加

export default function Home() {
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const timeOptions = [
    { label: "30分", value: 30 },
    { label: "1時間", value: 60 },
    { label: "3時間", value: 180 },
  ];

  const createRoom = async () => {
    // 振動フィードバック（Android等対応端末のみ）
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setLoading(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: duration }),
      });

      if (!res.ok) throw new Error("作成失敗");

      const data = await res.json();
      router.push(data.shareUrl);
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("エラーが発生しました");
    }
  };

  return (
    // h-[100dvh]: スマホのアドレスバー分を計算した完璧な高さ
    // touch-none: 引っ張り更新やスクロールを無効化してアプリ化
    // select-none: 文字選択を無効化（長押しメニュー防止）
    <main className="h-[100dvh] w-full bg-[#08081A] text-white overflow-hidden relative touch-none select-none flex flex-col">
      
      {/* --- 背景エフェクト --- */}
      {/* 上部の光 */}
      <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      {/* 下部の光 */}
      <div className="absolute bottom-[-10%] right-[-30%] w-[90vw] h-[90vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- コンテンツエリア --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pb-20">
        
        {/* タイトルロゴ */}
        <div className="mb-12 flex flex-col items-center">
          <div className="relative">
             {/* 雷アイコンでエネルギー感を演出 */}
            <Zap className="w-12 h-12 text-yellow-300 absolute -top-8 -right-6 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
            <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              Nowly
            </h1>
          </div>
          <p className="text-blue-200/60 text-sm font-bold tracking-widest mt-2">
            LOCATION SHARE
          </p>
        </div>

        {/* 時間選択 (Thumb Zone: 親指が届きやすい位置へ) */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          <p className="text-center text-xs text-gray-400 font-bold mb-3 tracking-widest opacity-70">
            有効期限を選択
          </p>
          
          <div className="flex items-center justify-between bg-[#0D0D25]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 w-full shadow-2xl">
            {timeOptions.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                   if (navigator.vibrate) navigator.vibrate(10); // 軽い振動
                   setDuration(item.value);
                }}
                className={`relative flex-1 py-3.5 text-center font-bold text-sm rounded-xl transition-all duration-200 ${
                  duration === item.value
                    ? "text-white"
                    : "text-gray-500 active:scale-95"
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                
                {/* 選ばれている時の背景発光 */}
                {duration === item.value && (
                  <div className="absolute inset-0 bg-gray-700/50 rounded-xl border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* アクションボタン (画面最下部近くに大きく配置) */}
        <div className="w-full max-w-sm mt-auto">
          <button
            onClick={createRoom}
            disabled={loading}
            // active:scale-95 で押した感触を視覚的に表現
            className={`w-full h-16 rounded-2xl font-black text-xl tracking-widest text-[#08081A] transition-all duration-150 flex items-center justify-center gap-2 relative overflow-hidden group
              ${
                loading
                  ? "bg-gray-700 cursor-wait"
                  : "bg-[#33E16F] active:scale-[0.97] active:bg-[#2bb556] shadow-[0_0_40px_rgba(51,225,111,0.4)]"
              }
            `}
          >
            {/* ボタン内のキラッとする光のエフェクト */}
            {!loading && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
            )}

            {loading ? (
              <Loader2 className="animate-spin w-6 h-6 text-white" />
            ) : (
              <>
                <span>START</span>
                <Zap className="w-5 h-5 fill-current" />
              </>
            )}
          </button>
          
          <p className="text-center text-[10px] text-gray-500 mt-4 font-medium">
            リンクを知っている人だけが参加できます
          </p>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [hq, setHq] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    setError("");
    if (!url) return setError("Please enter a website URL.");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, company_name: company || undefined, location: hq || undefined }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Failed to analyze — is the backend running?");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const colorFromScore = (s) => {
    if (s >= 75) return "bg-emerald-500";
    if (s >= 45) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">TerraTrust</h1>
          <p className="text-slate-600 mt-1">The Green Due-Diligence Platform — quick climate risk check.</p>
        </header>

        <section className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="col-span-2 p-3 border rounded"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={analyze}
              disabled={loading}
              className="p-3 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

            <input
              className="p-3 border rounded"
              placeholder="Optional: Company name (improves news search)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <input
              className="p-3 border rounded"
              placeholder="Optional: HQ City (improves risk check)"
              value={hq}
              onChange={(e) => setHq(e.target.value)}
            />
          </div>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </section>

        {result && (
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score / summary */}
            <div className="col-span-1 bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex items-center justify-center rounded-lg border">
                  <div className="text-3xl font-bold">{result.score}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold">TerraTrust Score</div>
                  <div className="text-xs text-slate-500 mt-1">{result.summary}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full h-3 bg-slate-100 rounded progress-bg">
                  <div className={`${colorFromScore(result.score)} h-3 rounded`} style={{ width: `${result.score}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-600">Source: website scrape, news, and estimated site carbon.</div>
            </div>

            {/* Highlights */}
            <div className="col-span-2 bg-white p-6 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-slate-700">🌱 Green Highlights</h3>
                  <ul className="mt-3 space-y-2">
                    {result.highlights.map((h, i) => (
                      <li key={i} className="text-sm bg-emerald-50 p-2 rounded">{h}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-700">🚨 Red Flags</h3>
                  <ul className="mt-3 space-y-2">
                    {result.risks.map((r, i) => (
                      <li key={i} className="text-sm bg-red-50 p-2 rounded">{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-medium">Show raw data (debug)</summary>
                <pre className="mt-3 max-h-96 overflow-auto bg-slate-50 p-3 rounded text-xs">{JSON.stringify(result.raw, null, 2)}</pre>
              </details>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

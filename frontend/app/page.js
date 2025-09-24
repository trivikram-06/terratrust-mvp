"use client";

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [response, setResponse] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleAnalyze = async () => {
  if (!url) return alert("Enter a website URL");

  // Auto-add https if missing
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fullUrl }),
    });
    const data = await res.json();
    setResponse(data);
  } catch (err) {
    console.error(err);
    alert("Backend request failed");
  }
};


  // Determine score color
  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        TerraTrust — Quick Climate Risk Check
      </h1>

      {/* Input + Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Enter company website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="p-3 rounded border border-gray-300 dark:border-gray-700 w-80 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          onClick={handleAnalyze}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded"
        >
          Analyze
        </button>
      </div>

      {/* Result Card */}
      {response && (
        <div className="w-full max-w-xl bg-white dark:bg-gray-800 p-6 rounded shadow-md">
          {/* Score */}
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            TerraTrust Score: {response.score || 54} / 100
          </h2>
          <div className="h-4 w-full rounded-full bg-gray-300 dark:bg-gray-700 mb-4">
            <div
              className={`${getScoreColor(response.score || 54)} h-4 rounded-full`}
              style={{ width: `${response.score || 54}%` }}
            ></div>
          </div>

          {/* Green Highlights */}
          <div className="mb-4">
            <h3 className="font-semibold text-green-600 mb-2">🌱 Green Highlights</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
              {(response.green_highlights || [
                "Low estimated site carbon per page load",
                "Hosting flagged as green / renewable",
                "Website mentions ESG policies"
              ])
                .slice(0, 3)
                .map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          {/* Red Flags */}
          <div className="mb-4">
            <h3 className="font-semibold text-red-600 mb-2">🚨 Red Flags</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
              {(response.red_flags || [
                "No sustainability-related keywords found on site",
                "Missing site title",
                "Missing meta description"
              ])
                .slice(0, 3)
                .map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          {/* Summary */}
          <div className="text-gray-700 dark:text-gray-300 mb-4">
            Summary: {response.summary || "Moderate risk — some sustainability signals but also gaps to investigate."}
          </div>

          {/* Raw Data Toggle */}
          <button
            className="text-sm text-blue-500 hover:underline mb-2"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? "Hide Raw Data" : "Show Raw Data"}
          </button>
          {showRaw && (
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

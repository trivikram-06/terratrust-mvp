"use client";

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [response, setResponse] = useState(null);

  const handleAnalyze = async () => {
    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setResponse(data);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <input
        type="text"
        placeholder="Enter website URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-2 mb-4 w-80"
      />
      <button
        onClick={handleAnalyze}
        className="bg-green-500 text-white p-2 rounded"
      >
        Analyze
      </button>

      {response && (
        <pre className="mt-4 p-2 border w-80">{JSON.stringify(response, null, 2)}</pre>
      )}
    </div>
  );
}

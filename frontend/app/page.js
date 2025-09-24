"use client";

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [response, setResponse] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return alert("Enter a website URL");

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

  return (
    <div className="container">
      <h1>TerraTrust — Quick Climate Risk Check</h1>

      {/* Input + Button */}
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter company website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleAnalyze}>Analyze</button>
      </div>

      {/* Results */}
      {response && (
        <div>
          {/* Circular Score */}
          <div className="circle-container">
            <div
              className="circle"
              style={{ "--score": response.score || 54 }}
            >
              <div className="circle-text">
                {response.score || 54}
              </div>
            </div>
          </div>

          {/* Green Highlights */}
          <div className="green-section">
            <h2>🌱 Green Highlights</h2>
            <ul>
              {(response.green_highlights || [
                "Low estimated site carbon per page load",
                "Hosting flagged as green / renewable",
                "Website mentions ESG policies",
              ])
                .slice(0, 3)
                .map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
            </ul>
          </div>

          {/* Red Flags */}
          <div className="red-section">
            <h2>🚨 Red Flags</h2>
            <ul>
              {(response.red_flags || [
                "No sustainability-related keywords found on site",
                "Missing site title",
                "Missing meta description",
              ])
                .slice(0, 3)
                .map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
            </ul>
          </div>

          {/* Summary */}
          <div className="summary">
            Summary:{" "}
            {response.summary ||
              "Moderate risk — some sustainability signals but also gaps to investigate."}
          </div>

          {/* Raw Data Toggle */}
          <button
            style={{ marginTop: "15px", background: "transparent", color: "#007bff" }}
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? "Hide Raw Data" : "Show Raw Data"}
          </button>
          {showRaw && (
            <pre
              style={{
                background: "#f4f4f4",
                padding: "10px",
                borderRadius: "6px",
                marginTop: "10px",
                fontSize: "14px",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

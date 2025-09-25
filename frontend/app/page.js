"use client";

import { useState } from "react";

export default function HomePage() {
  const [urls, setUrls] = useState("");
  const [mode, setMode] = useState("single"); // "single" or "multiple"
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    const urlList =
      mode === "multiple"
        ? urls.split(",").map((u) => u.trim()).filter(Boolean)
        : [urls.trim()];

    if (urlList.length === 0) return alert("Please enter URL(s)");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Error analyzing URLs");
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (results.length === 0) return alert("No results to download");
    try {
      const res = await fetch("http://localhost:5000/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "terratrust_report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF");
    }
  };

  return (
    <div className="container">
      <h1>TerraTrust Dashboard</h1>

      {/* Mode selection */}
      <div style={{ marginBottom: "15px" }}>
        <button
          style={{
            marginRight: "10px",
            background: mode === "single" ? "#007bff" : "#ccc",
            color: "#fff",
            padding: "5px 10px",
          }}
          onClick={() => setMode("single")}
        >
          Single Company
        </button>
        <button
          style={{
            background: mode === "multiple" ? "#007bff" : "#ccc",
            color: "#fff",
            padding: "5px 10px",
          }}
          onClick={() => setMode("multiple")}
        >
          Multiple Companies
        </button>
      </div>

      {/* URL input */}
      <input
        type="text"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder={
          mode === "single"
            ? "Enter company URL"
            : "Enter multiple URLs separated by comma"
        }
      />
      <button onClick={handleAnalyze}>{loading ? "Analyzing..." : "Analyze"}</button>

      {/* Download PDF */}
      {results.length > 0 && (
        <div style={{ marginTop: "15px" }}>
          <button
            onClick={handleDownloadPDF}
            style={{ padding: "8px 15px", background: "green", color: "#fff" }}
          >
            Download PDF Report
          </button>
        </div>
      )}

      {/* Results */}
      {results.map((r, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginTop: "15px",
            borderRadius: "10px",
          }}
        >
          <h2>{r.url}</h2>

          {/* Circular Score */}
          <div className="circle-container">
            <div
              className="circle"
              style={{ "--score": r.scores.total || 50 }}
            >
              <div className="circle-text">{r.scores.total || 50}</div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="score">
            Carbon: {r.scores.carbon} | Reputation: {r.scores.reputation} | Location: {r.scores.location} | Policy: {r.scores.policy}
          </div>

          {/* Highlights */}
          <div className="green-section">
            <h2>🌱 Highlights</h2>
            <ul>
              {(r.raw.website.found_keywords.length > 0
                ? r.raw.website.found_keywords.slice(0, 3)
                : ["No sustainability keywords found"]
              ).map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="red-section">
            <h2>🚨 Risks</h2>
            <ul>
              {(!r.raw.website.found_keywords.length
                ? ["No sustainability keywords found"]
                : []
              )
                .concat(
                  r.raw.website.reports.length === 0 ? ["No report PDFs found"] : []
                )
                .slice(0, 3)
                .map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
            </ul>
          </div>

          {/* Summary */}
          <div className="summary">{r.summary}</div>
        </div>
      ))}
    </div>
  );
}

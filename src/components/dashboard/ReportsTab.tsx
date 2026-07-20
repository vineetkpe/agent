import React, { useState, useEffect } from "react";
import { FileText, Download, Clock, Printer, CheckCircle, Database } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface ReportsTabProps {
  allSites: any[];
  currentSite: any;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ allSites, currentSite }) => {
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [reportType, setReportType] = useState("audit_summary");
  const [range, setRange] = useState("30_days");
  const [format, setFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (currentSite?.id) {
      setSelectedSiteId(currentSite.id);
    } else if (allSites.length > 0) {
      setSelectedSiteId(allSites[0].id);
    }
  }, [currentSite, allSites]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/reports/generate");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch report history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      alert("Please select a site to generate a report.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: selectedSiteId,
          reportType,
          range,
          format,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report.");
      }

      // Read response as blog or octet-stream
      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", `heydrona-seo-report-${selectedSiteId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      // Refresh generation history log list
      fetchHistory();
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred during report generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-12">
      <div className="border-b pb-4 border-zinc-100">
        <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
          <Printer className="w-5 h-5 text-violet-500" /> Branded SEO Reports
        </h2>
        <p className="text-sm mt-1 text-zinc-550">
          Compile on-demand branded SEO audit summaries and performance metrics to PDF or CSV format.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Controls */}
        <Card variant="flat" className="lg:col-span-1 border-2 border-zinc-950 p-6 bg-white space-y-6">
          <h3 className="text-sm font-mono font-extrabold uppercase tracking-wider text-zinc-900 border-b pb-2">
            Configure Export
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-zinc-500 font-bold block uppercase tracking-wider">Select Site</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full p-2.5 border-2 border-zinc-950 bg-white rounded-xl focus:outline-none focus:border-violet-500 font-bold text-zinc-800"
              >
                <option value="">-- Choose site --</option>
                {allSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.url.replace(/^https?:\/\/(www\.)?/i, "")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-500 font-bold block uppercase tracking-wider">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-2.5 border-2 border-zinc-950 bg-white rounded-xl focus:outline-none focus:border-violet-500 font-bold text-zinc-800"
              >
                <option value="audit_summary">Audit Summary Checklist</option>
                <option value="health">SEO Health Scorecard</option>
                <option value="performance">GSC Performance Metrics</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-500 font-bold block uppercase tracking-wider">Time Range</label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full p-2.5 border-2 border-zinc-950 bg-white rounded-xl focus:outline-none focus:border-violet-500 font-bold text-zinc-800"
              >
                <option value="7_days">Last 7 Days</option>
                <option value="30_days">Last 30 Days</option>
                <option value="90_days">Last 90 Days</option>
                <option value="all_time">All Time Summary</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-500 font-bold block uppercase tracking-wider">Output Format</label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === "pdf"}
                    onChange={() => setFormat("pdf")}
                    className="accent-violet-650"
                  />
                  Branded PDF
                </label>
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === "csv"}
                    onChange={() => setFormat("csv")}
                    className="accent-violet-650"
                  />
                  Raw CSV
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isGenerating || !selectedSiteId}
                className="w-full"
              >
                {isGenerating ? "Compiling Report..." : "Generate & Download"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Generation History Log */}
        <Card variant="flat" className="lg:col-span-2 border-2 border-zinc-950 p-6 bg-white space-y-6">
          <h3 className="text-sm font-mono font-extrabold uppercase tracking-wider text-zinc-900 border-b pb-2">
            Generation History Log
          </h3>

          {history.length > 0 ? (
            <div className="overflow-x-auto font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-950 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2 px-3">Site Domain</th>
                    <th className="py-2 px-3">Report Scope</th>
                    <th className="py-2 px-3">Format</th>
                    <th className="py-2 px-3 text-right">Generated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-zinc-900">{log.siteUrl.replace(/^https?:\/\/(www\.)?/i, "")}</td>
                      <td className="py-3 px-3 capitalize">{log.reportType.replace("_", " ")}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.format === "pdf" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          {log.format}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-500">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-400 font-mono">
              <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              No reports have been compiled yet. Use the configuration panel to download your first summary report.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

import React, { useMemo } from "react";
import { ReactFlow, Background, Controls, Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "../ui/Card";
import { Sparkles, Globe, Shield, Search, CheckSquare, FileText, CheckCircle, RotateCw } from "lucide-react";

interface AgentFlowViewProps {
  currentSite: any;
  currentAudit: any;
  isCrawling: boolean;
  crawlStep: string;
  selectTab: (tab: any) => void;
  onRefresh: () => void;
}

export const AgentFlowView: React.FC<AgentFlowViewProps> = ({
  currentSite,
  currentAudit,
  isCrawling,
  crawlStep,
  selectTab,
  onRefresh,
}) => {
  // Derive statuses
  const crawlStatus = useMemo(() => {
    if (isCrawling && (crawlStep.includes("crawling") || crawlStep.includes("resolving") || crawlStep.includes("Initiating"))) {
      return "running";
    }
    if (currentAudit?.status === "completed") return "done";
    if (currentAudit?.status === "failed") return "failed";
    return currentAudit ? "done" : "pending";
  }, [isCrawling, crawlStep, currentAudit]);

  const businessStatus = useMemo(() => {
    if (currentSite?.businessProfile || currentSite?.manuallyEnteredContext) return "done";
    if (isCrawling && crawlStep.toLowerCase().includes("business")) {
      return "running";
    }
    return "pending";
  }, [currentSite, isCrawling, crawlStep]);

  const competitorStatus = useMemo(() => {
    let comps: any[] = [];
    if (currentSite?.competitorsJson) {
      try {
        comps = JSON.parse(currentSite.competitorsJson);
      } catch (e) {}
    }
    const hasScanned = comps.some((c: any) => c.scanResult);
    if (hasScanned) return "done";
    if (comps.length > 0) return "done"; // suggested or confirmed is also setup done
    return "pending";
  }, [currentSite]);

  const keywordStatus = useMemo(() => {
    const hasKeywords = currentAudit?.items?.some((i: any) => i.type === "keyword_opportunity");
    if (hasKeywords) return "done";
    if (isCrawling && (crawlStep.includes("Gemini") || crawlStep.includes("keyword"))) {
      return "running";
    }
    return "pending";
  }, [currentAudit, isCrawling, crawlStep]);

  const checklistStatus = useMemo(() => {
    const hasBlog = currentAudit?.items?.some((i: any) => i.type === "blog_post");
    if (hasBlog) return "done";
    if (isCrawling && crawlStep.toLowerCase().includes("checklist")) {
      return "running";
    }
    return "pending";
  }, [currentAudit, isCrawling, crawlStep]);

  const aiWritingStatus = useMemo(() => {
    const hasBlog = currentAudit?.items?.some((i: any) => i.type === "blog_post");
    if (hasBlog) return "done";
    if (isCrawling && (crawlStep.toLowerCase().includes("writing") || crawlStep.toLowerCase().includes("blog"))) {
      return "running";
    }
    return "pending";
  }, [currentAudit, isCrawling, crawlStep]);

  const publishStatus = useMemo(() => {
    const items = currentAudit?.items || [];
    const blogs = items.filter((i: any) => i.type === "blog_post");
    if (blogs.length === 0) return "pending";
    if (blogs.some((b: any) => b.status === "applied")) return "done"; // Published
    if (blogs.some((b: any) => b.status === "approved")) return "done"; // Approved
    return "pending"; // Pending approval
  }, [currentAudit]);

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "done":
        return {
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-500",
          textColor: "text-emerald-800",
          badge: "Done",
          badgeColor: "bg-emerald-500 text-white",
        };
      case "running":
        return {
          bgColor: "bg-sky-50 animate-pulse",
          borderColor: "border-sky-500",
          textColor: "text-sky-800",
          badge: "Running",
          badgeColor: "bg-sky-500 text-white animate-spin",
        };
      case "failed":
        return {
          bgColor: "bg-rose-50",
          borderColor: "border-rose-500",
          textColor: "text-rose-800",
          badge: "Failed",
          badgeColor: "bg-rose-500 text-white",
        };
      default:
        return {
          bgColor: "bg-zinc-50",
          borderColor: "border-zinc-350",
          textColor: "text-zinc-500",
          badge: "Pending",
          badgeColor: "bg-zinc-300 text-zinc-650",
        };
    }
  };

  const stages = [
    { id: "crawl", label: "Crawler Scan", icon: <Globe className="w-5 h-5" />, status: crawlStatus, tab: "crawler", description: "Crawls subpages & audits tags" },
    { id: "context", label: "Business Context", icon: <CheckCircle className="w-5 h-5" />, status: businessStatus, tab: "context", description: "Extracts business metadata" },
    { id: "competitors", label: "Competitor Comparison", icon: <Shield className="w-5 h-5" />, status: competitorStatus, tab: "competitors", description: "Technical technical scan" },
    { id: "keywords", label: "Keyword Research", icon: <Search className="w-5 h-5" />, status: keywordStatus, tab: "keywords", description: "Identifies search gaps" },
    { id: "checklist", label: "Content Checklist", icon: <CheckSquare className="w-5 h-5" />, status: checklistStatus, tab: "recommendations", description: "Validates content quality" },
    { id: "writing", label: "AI Post Writer", icon: <FileText className="w-5 h-5" />, status: aiWritingStatus, tab: "content", description: "Drafts blogs with Unsplash" },
    { id: "publish", label: "WordPress Connect", icon: <Sparkles className="w-5 h-5" />, status: publishStatus, tab: "connections", description: "CMS publication & approvals" },
  ];

  // Define nodes for ReactFlow
  const initialNodes: Node[] = stages.map((stage, idx) => {
    const details = getStatusDetails(stage.status);
    return {
      id: stage.id,
      position: { x: idx * 250 + 50, y: 150 },
      data: {
        label: (
          <div
            onClick={() => selectTab(stage.tab)}
            className={`p-4 border-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] text-left cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] w-[210px] bg-white border-zinc-950 font-mono`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-1.5 font-extrabold text-zinc-900 text-xs">
                {stage.icon}
                <span>{stage.label}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${details.badgeColor}`}>
                {details.badge}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
              {stage.description}
            </p>
          </div>
        )
      },
      style: {
        width: 210,
        padding: 0,
        borderRadius: 16,
        border: "none",
        background: "transparent",
      }
    };
  });

  const initialEdges: Edge[] = stages.slice(0, -1).map((stage, idx) => ({
    id: `e-${stage.id}-${stages[idx + 1].id}`,
    source: stage.id,
    target: stages[idx + 1].id,
    animated: stage.status === "running" || stages[idx + 1].status === "running",
    style: {
      stroke: stage.status === "done" ? "#10b981" : "#d4d4d8",
      strokeWidth: 3,
    }
  }));

  return (
    <div className="space-y-6 animate-slide-up h-full flex flex-col">
      <div className="pb-4 border-b border-zinc-150 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Agent Pipeline Flow View</h2>
          <p className="text-sm mt-1 text-zinc-550 font-mono">
            Watch the live, node-based pipeline status for crawls, content generation, and WordPress push.
          </p>
        </div>
        <button
          onClick={onRefresh}
          type="button"
          className="px-3.5 py-1.5 border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-mono font-bold rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5" /> Refresh Pipeline
        </button>
      </div>

      {isCrawling && (
        <div className="p-4 bg-sky-50 border-2 border-sky-200 text-sky-800 text-xs font-mono rounded-xl flex items-center gap-3 shadow-md animate-pulse">
          <span className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <span className="font-extrabold uppercase block tracking-wider text-[10px]">Pipeline executing</span>
            <span className="text-[11px] text-sky-650">{crawlStep}</span>
          </div>
        </div>
      )}

      {/* ReactFlow Canvas Container */}
      <div className="flex-1 min-h-[460px] border-2 border-zinc-950 rounded-2xl bg-zinc-50/30 overflow-hidden relative shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          fitView
          nodesConnectable={false}
          nodesDraggable={true}
          zoomOnScroll={false}
          preventScrolling={false}
        >
          <Background color="#cbd5e1" gap={16} size={1.5} />
          <Controls className="border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] bg-white overflow-hidden" />
        </ReactFlow>
      </div>

      <div className="p-4 border-2 border-zinc-950 bg-zinc-50 rounded-xl font-mono text-[10px] text-zinc-505 leading-relaxed">
        <strong>💡 PRO-TIP:</strong> Drag nodes to reorganize your layout view on canvas. Click on any node block to instantly load details in its respective tab.
      </div>
    </div>
  );
};
export default AgentFlowView;

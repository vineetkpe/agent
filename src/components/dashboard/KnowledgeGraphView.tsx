import React, { useMemo } from "react";
import { ReactFlow, Background, Controls, Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "../ui/Card";
import { Share2, Sparkles, HelpCircle, Activity } from "lucide-react";

interface KnowledgeGraphViewProps {
  currentSite: any;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ currentSite }) => {
  const graphData = useMemo(() => {
    if (!currentSite?.knowledgeGraphData) return null;
    try {
      return JSON.parse(currentSite.knowledgeGraphData);
    } catch (e) {
      console.error("[KnowledgeGraphView] Failed to parse knowledgeGraphData JSON:", e);
      return null;
    }
  }, [currentSite]);

  const flowData = useMemo(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) return { nodes: [], edges: [] };

    const totalNodes = graphData.nodes.length;
    
    // Position nodes in a clean circular layout to look organized and readable
    const nodes: Node[] = graphData.nodes.map((node: any, idx: number) => {
      const angle = (idx / totalNodes) * 2 * Math.PI;
      const radius = totalNodes > 10 ? 300 : 200;
      const x = 350 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      let typeBg = "bg-indigo-50 border-indigo-200 text-indigo-750";
      if (node.type === "product") {
        typeBg = "bg-emerald-50 border-emerald-200 text-emerald-750";
      } else if (node.type === "service") {
        typeBg = "bg-amber-50 border-amber-200 text-amber-750";
      } else if (node.type === "topic") {
        typeBg = "bg-violet-50 border-violet-200 text-violet-750";
      }

      return {
        id: node.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-3 bg-white border-2 border-zinc-950 rounded-xl shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] text-left min-w-[150px] max-w-[200px] break-all select-none">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono ${typeBg} border mb-1`}>
                {node.type}
              </span>
              <div className="font-bold text-zinc-900 text-[10px] truncate leading-snug">
                {node.title}
              </div>
              {node.url && (
                <span className="text-[8px] text-zinc-450 block truncate mt-1 hover:underline font-mono">
                  {node.url.replace(/^https?:\/\/(www\.)?/i, "")}
                </span>
              )}
            </div>
          ),
        },
        style: { background: "transparent", border: "none" },
      };
    });

    const edges: Edge[] = graphData.edges.map((edge: any, idx: number) => {
      let stroke = "#94a3b8"; // Default color
      let animated = false;
      let label = "";
      
      if (edge.relation === "about_product") {
        stroke = "#10b981"; // Emerald
        animated = true;
        label = "covers product";
      } else if (edge.relation === "about_service") {
        stroke = "#f59e0b"; // Amber
        animated = true;
        label = "covers service";
      } else if (edge.relation === "links_to") {
        stroke = "#6366f1"; // Indigo
        label = "links to";
      }

      return {
        id: `edge-${idx}`,
        source: edge.from,
        target: edge.to,
        animated,
        style: { stroke, strokeWidth: 1.5 },
        label,
        labelStyle: { fontSize: 7, fill: "#64748b", fontStyle: "italic", fontWeight: "bold" },
      };
    });

    return { nodes, edges };
  }, [graphData]);

  if (!graphData) {
    return (
      <Card variant="flat" className="p-12 text-center space-y-6 bg-zinc-50/10 border-2 border-dashed border-zinc-250 rounded-2xl">
        <div className="w-16 h-16 rounded-full border-2 border-zinc-950 flex items-center justify-center mx-auto bg-violet-50 text-violet-600 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] animate-bounce">
          <Share2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 uppercase font-mono">
            No Site Map Graph Generated Yet
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed font-mono">
            To view a visual layout map of pages, product pages, and service relationships, execute a new crawl audit scan on this domain.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card variant="flat" className="p-4 bg-white border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-md font-extrabold uppercase font-mono tracking-wider text-zinc-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-500" /> Topic &amp; Site Link Map
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              Deterministic graph mapping page link matrices (<span className="text-indigo-500 font-bold">links_to</span>) and discovered product/service matches (<span className="text-emerald-600 font-bold">covers product</span>, <span className="text-amber-500 font-bold">covers service</span>).
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono font-bold shrink-0">
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border px-2 py-1 rounded">
              Nodes: {flowData.nodes.length}
            </div>
            <div className="flex items-center gap-1 bg-violet-50 text-violet-750 border px-2 py-1 rounded">
              Edges: {flowData.edges.length}
            </div>
          </div>
        </div>
      </Card>

      {/* Visual Canvas */}
      <div className="h-[550px] border-2 border-zinc-950 rounded-2xl bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] overflow-hidden relative">
        <ReactFlow
          nodes={flowData.nodes}
          edges={flowData.edges}
          fitView
          maxZoom={1.5}
          minZoom={0.2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#52525b" gap={24} size={1} />
          <Controls className="!bg-white !border-2 !border-zinc-950 !rounded-xl !shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] !p-0.5 !m-4" />
        </ReactFlow>
      </div>
    </div>
  );
};

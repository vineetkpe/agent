import React from "react";
import { CheckCircle, XCircle, Clock, Copy, Check, Zap, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface RecommendationsTabProps {
  currentAudit: any;
  handleActionItem: (itemId: string, action: "approve" | "reject") => void;
  handleCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

const getRecommendationDetails = (type: string) => {
  switch (type) {
    case "meta_title":
      return {
        explanation: "The meta title tag is either entirely missing or is not within the optimized length (30-65 characters).",
        whyItMatters: "Titles are the primary blue link headings Google displays. A sub-optimal title reduces search click-through rates (CTR) and impairs visibility.",
        impact: "High",
        impactScore: 95,
      };
    case "meta_description":
      return {
        explanation: "The page description meta tag is either missing or too short/long (recommended range is 120-160 characters).",
        whyItMatters: "Meta descriptions act as snippet advertising copy in search results. A clear summary convinces search users to choose your link over competitors.",
        impact: "High",
        impactScore: 85,
      };
    case "schema_markup":
      return {
        explanation: "Missing JSON-LD structured data schema (e.g. LocalBusiness, WebSite, or Article schemas).",
        whyItMatters: "Schemas inform search bots of explicit entity details (reviews, address, pricing). Adding schema makes your link eligible for rich graphical snippets on Google.",
        impact: "Medium",
        impactScore: 70,
      };
    case "missing_alt":
      return {
        explanation: "Image elements are missing descriptive 'alt' attribute tags.",
        whyItMatters: "Search engine algorithms cannot 'read' graphics. Alternative text indexes images in Google Images and is crucial for accessibility compliance (screen readers).",
        impact: "Medium",
        impactScore: 60,
      };
    case "broken_link":
      return {
        explanation: "Outbound link anchors are pointing to targets returning 404 or connection timeouts.",
        whyItMatters: "Broken links exhaust crawler budgets and harm authority score. They frustrate users, signaling search crawlers that a site is poorly maintained.",
        impact: "High",
        impactScore: 90,
      };
    default:
      return {
        explanation: "Identified quality or structural gap in site markup.",
        whyItMatters: "Ensures search engine indexing efficiency and user retention.",
        impact: "Low",
        impactScore: 40,
      };
  }
};

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  currentAudit,
  handleActionItem,
  handleCopyText,
  copiedId,
}) => {
  const metaFixes =
    currentAudit?.items?.filter((item: any) =>
      ["meta_title", "meta_description", "schema_markup", "missing_alt", "broken_link"].includes(item.type)
    ) || [];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">AI Recommendations & Action Log</h2>
          <p className="text-sm mt-1 text-zinc-550">
            Explain issues, check their structural importance, view potential impact, and deploy one-click fixes live to CMS.
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full border font-mono bg-violet-50 text-violet-600 border-violet-200">
          {metaFixes.length} Actions Available
        </span>
      </div>

      {metaFixes.length === 0 ? (
        <Card variant="flat" className="p-16 text-center text-zinc-500">
          No SEO tag recommendation log found. Complete a site crawl diagnostics run first!
        </Card>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {metaFixes.map((item: any) => {
            const isApproved = item.status === "approved";
            const isRejected = item.status === "rejected";
            const isApplied = item.status === "applied";
            const currentValParsed = item.currentValue ? JSON.parse(item.currentValue) : null;
            const details = getRecommendationDetails(item.type);

            return (
              <Card
                key={item.id}
                variant="flat"
                className="space-y-6 relative hover:shadow-md transition-shadow duration-200"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="violet">{item.type.replace("_", " ")}</Badge>
                    <span className="text-xs font-mono truncate max-w-xs text-zinc-550">
                      {item.targetUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isApplied && (
                      <Badge variant="emerald">
                        <CheckCircle className="w-3.5 h-3.5" /> Pushed Draft
                      </Badge>
                    )}
                    {isApproved && (
                      <Badge variant="emerald">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge variant="zinc">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </Badge>
                    )}
                    {item.status === "pending" && (
                      <Badge variant="amber" className="animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Explained Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl text-xs transition-all bg-zinc-50 border-zinc-200 shadow-inner">
                  <div className="space-y-1">
                    <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-500">
                      Explain the Issue
                    </span>
                    <p className="leading-relaxed text-zinc-650">{details.explanation}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-500">
                      Why it Matters
                    </span>
                    <p className="leading-relaxed text-zinc-650">{details.whyItMatters}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-500">
                      SEO Impact Potential
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          details.impact === "High"
                            ? "bg-red-500/10 text-red-600 border border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-750 border border-yellow-500/20"
                        }`}
                      >
                        {details.impact} Impact
                      </span>
                      <span className="font-mono text-zinc-600">{details.impactScore}/100</span>
                    </div>
                    {/* Strength meter bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${details.impactScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tag Modification Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl text-xs transition-all border bg-red-50/40 border-red-200">
                    <span className="text-[10px] text-red-550 font-bold block uppercase tracking-wide mb-1">
                      Current Value
                    </span>
                    <p className="text-zinc-500 line-through leading-relaxed">
                      {currentValParsed?.title ||
                        currentValParsed?.description ||
                        currentValParsed?.count ||
                        (item.type === "schema_markup" ? "Missing schema.org markup block" : "Empty attribute")}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl relative group text-xs border transition-all bg-violet-50/40 border-violet-200/50">
                    <span className="text-[10px] text-violet-600 font-bold block uppercase tracking-wide mb-1">
                      AI Recommendation Fix
                    </span>
                    <p className="font-medium leading-relaxed pr-8 text-zinc-800">
                      {item.suggestedValue}
                    </p>
                    <button
                      onClick={() => handleCopyText(item.suggestedValue, item.id)}
                      className="absolute right-2 top-2 p-1.5 rounded-lg border transition-all opacity-0 group-hover:opacity-100 bg-white border-zinc-200 text-zinc-500 hover:text-zinc-850"
                      title="Copy code suggestion"
                      type="button"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* One-Click Fix Action Bar */}
                {item.status === "pending" && (
                  <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
                    <Button variant="secondary" onClick={() => handleActionItem(item.id, "reject")}>
                      Reject Fix
                    </Button>
                    <Button variant="primary" onClick={() => handleActionItem(item.id, "approve")}>
                      <Zap className="w-3.5 h-3.5" /> One-Click Fix
                    </Button>
                  </div>
                )}

                {/* If approved/applied, show integration copying option */}
                {(isApproved || isApplied) && (
                  <div className="p-3 rounded-xl border flex items-center justify-between text-xs transition-all bg-zinc-50 border-zinc-200">
                    <code className="text-xs font-mono truncate max-w-lg text-zinc-650">
                      {item.type === "schema_markup"
                        ? item.suggestedValue.substring(0, 100) + "..."
                        : item.suggestedValue}
                    </code>
                    <Button
                      variant="secondary"
                      onClick={() => handleCopyText(item.suggestedValue, item.id + "-approved")}
                    >
                      {copiedId === item.id + "-approved" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied Code
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Snippet
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

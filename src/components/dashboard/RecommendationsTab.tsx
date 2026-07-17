import React, { useState } from "react";
import { CheckCircle, XCircle, Clock, Copy, Check, Zap, AlertTriangle, Clipboard, ExternalLink, ChevronDown, ChevronUp, HeartPulse } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface RecommendationsTabProps {
  currentAudit: any;
  handleActionItem: (itemId: string, action: "approve" | "reject") => void;
  handleCopyText: (text: string, id: string) => void;
  copiedId: string | null;
  currentSite?: any;
  selectTab: (tab: any) => void;
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
    case "heading_structure":
      return {
        explanation: "Nesting order sequence audit checks for H1 counts and skipped nesting levels (e.g. H2 followed directly by H4).",
        whyItMatters: "A logical heading hierarchy is crucial for screen readers, accessibility, and search engine content parsing.",
        impact: "High",
        impactScore: 80,
      };
    case "canonical_tag":
      return {
        explanation: "Checks for valid self-referencing canonical links in the head.",
        whyItMatters: "Canonical links direct bots to index the authoritative URL version, preventing duplicate index issues.",
        impact: "High",
        impactScore: 85,
      };
    case "social_meta":
      return {
        explanation: "Checks for standard OpenGraph (og:title, og:description, og:image) and Twitter meta markup cards in the head.",
        whyItMatters: "Social tags yield visually rich previews when your site pages are shared on social platforms, optimizing CTR.",
        impact: "Medium",
        impactScore: 65,
      };
    case "insecure_link":
      return {
        explanation: "Identifies insecure HTTP links pointing to internal endpoints on your secure HTTPS site.",
        whyItMatters: "HTTP endpoints trigger browser security warnings and reduce search engines trust in your SSL setups.",
        impact: "High",
        impactScore: 90,
      };
    case "duplicate_content":
      return {
        explanation: "Checks for identical SEO title headers or meta description blocks shared across different pages.",
        whyItMatters: "Identical pages compete against each other in search engines (keyword cannibalization) and dilute site authority.",
        impact: "High",
        impactScore: 88,
      };
    case "robots_sitemap":
      return {
        explanation: "Verifies the presence and accessibility of standard search engine directives (robots.txt and sitemap.xml).",
        whyItMatters: "Robots and sitemaps are core directories that guide bots to correctly crawl and index all available site paths.",
        impact: "High",
        impactScore: 95,
      };
    case "image_weight":
      return {
        explanation: "Scans for oversized image assets exceeding the maximum recommended budget limit of 300KB.",
        whyItMatters: "Heavy images dramatically slow down LCP load speed scores, reducing visual speed perception and search rankings.",
        impact: "Medium",
        impactScore: 70,
      };
    case "internal_linking":
      return {
        explanation: "Suggests valuable internal context linking opportunities between related crawls based on topic similarities.",
        whyItMatters: "Internal anchors build crawling paths, pass page equity, and enable readers to explore related content naturally.",
        impact: "High",
        impactScore: 85,
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
  currentSite,
  selectTab,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const metaFixes =
    currentAudit?.items?.filter((item: any) =>
      [
        "meta_title",
        "meta_description",
        "schema_markup",
        "missing_alt",
        "broken_link",
        "heading_structure",
        "canonical_tag",
        "social_meta",
        "insecure_link",
        "duplicate_content",
        "robots_sitemap",
        "image_weight",
        "internal_linking",
      ].includes(item.type)
    ) || [];

  const keywordOpportunities =
    currentAudit?.items?.filter((item: any) => item.type === "keyword_opportunity") || [];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Keyword Opportunities Section */}
      {keywordOpportunities.length > 0 && (
        <Card variant="flat" className="space-y-6">
          <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-zinc-900 font-mono uppercase tracking-wider">Target Keyword Opportunities Discovered</h3>
              <p className="text-xs text-zinc-550 mt-0.5">High-potential search queries to target for rank improvements and content gaps.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wide">
              {keywordOpportunities.length} opportunities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keywordOpportunities.map((item: any) => {
              let parsedOpp = { keyword: "", rationale: "", intent: "", position: null, impressions: null };
              try {
                parsedOpp = JSON.parse(item.suggestedValue || "{}");
              } catch (e) {}

              const isVerified = item.source === "gsc_verified";

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors space-y-3 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-extrabold text-zinc-800 font-mono">
                        "{parsedOpp.keyword}"
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-50 text-violet-650 border border-violet-100 uppercase tracking-wide font-mono shrink-0">
                        {parsedOpp.intent}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-650">
                      {parsedOpp.rationale}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-4">
                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide flex items-center gap-1">
                        Verified from Search Console
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-50 text-zinc-400 border border-zinc-100 uppercase tracking-wide flex items-center gap-1">
                        AI Suggested
                      </span>
                    )}

                    {isVerified && (parsedOpp.position !== null || parsedOpp.impressions !== null) && (
                      <div className="text-[10px] font-mono text-zinc-500 space-x-3 shrink-0">
                        <span>avg. pos: <strong className="text-zinc-850 font-bold">{parsedOpp.position !== null ? Number(parsedOpp.position).toFixed(1) : "--"}</strong></span>
                        <span>impr: <strong className="text-zinc-850 font-bold">{parsedOpp.impressions || "--"}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">AI Recommendations & Action Log</h2>
          <p className="text-sm mt-1 text-zinc-550">
            Explain issues, check their structural importance, view potential impact, and deploy one-click fixes live to CMS.
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full border font-mono bg-violet-50 text-violet-600 border-violet-200 shrink-0">
          {metaFixes.length} Actions Available
        </span>
      </div>

      {metaFixes.length === 0 ? (
        <Card variant="flat" className="p-16 text-center space-y-6 max-w-2xl mx-auto border-2 border-dashed border-zinc-300 bg-zinc-50/20 rounded-2xl">
          <div className="mx-auto w-14 h-14 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
            <HeartPulse className="w-7 h-7" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-zinc-900 font-mono uppercase tracking-wider">
              No Recommendations Found
            </h3>
            <p className="text-xs text-zinc-550 leading-relaxed font-mono max-w-md mx-auto">
              We haven't found any SEO gaps or optimization fixes yet. Start a website crawl diagnostics scan to generate structured recommendations.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => selectTab("crawler")}
              type="button"
              className="px-5 py-2.5 border-2 border-zinc-950 bg-violet-650 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650/90 cursor-pointer"
            >
              Run your first audit
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {metaFixes.map((item: any) => {
            const isExpanded = !!expandedIds[item.id];
            const isApproved = item.status === "approved";
            const isRejected = item.status === "rejected";
            const isApplied = item.status === "applied";
            const currentValParsed = item.currentValue ? JSON.parse(item.currentValue) : null;
            const details = getRecommendationDetails(item.type);

            // Intercept example.com placeholders and substitute the user's domain name
            const renderedUrl = item.targetUrl.includes("example.com") && currentSite?.url
              ? item.targetUrl.replace("https://example.com", currentSite.url)
              : item.targetUrl;

            return (
              <Card
                key={item.id}
                variant="flat"
                className={`relative hover:shadow-md transition-shadow duration-200 p-4 border ${
                  isExpanded ? "border-zinc-350 bg-white" : "border-zinc-200 bg-zinc-50/20"
                }`}
              >
                {/* Accordion header trigger */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-zinc-400 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-650" /> : <ChevronDown className="w-4 h-4 text-zinc-650" />}
                    </span>
                    <Badge variant="violet" className="shrink-0 font-mono text-[9px] uppercase">
                      {item.type.replace("_", " ")}
                    </Badge>
                    <span className="text-sm font-mono text-zinc-700 truncate break-all max-w-[200px] sm:max-w-md">
                      {renderedUrl}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        details.impact === "High"
                          ? "bg-red-500/10 text-red-600 border border-red-500/20"
                          : "bg-yellow-500/10 text-yellow-750 border border-yellow-500/20"
                      }`}
                    >
                      {details.impact} Impact
                    </span>

                    {isApplied && <Badge variant="emerald">Live on Site</Badge>}
                    {isApproved && <Badge variant="amber">Approved -- Manual Action Needed</Badge>}
                    {isRejected && <Badge variant="zinc">Rejected</Badge>}
                    {item.status === "pending" && (
                      <Badge variant="amber" className="animate-pulse">Pending Review</Badge>
                    )}

                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-bold border rounded-lg bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] shrink-0 font-mono"
                    >
                      {isExpanded ? "Collapse" : "Review Fix"}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-zinc-250/70 space-y-6 animate-fade-in">
                    {/* Explained Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl text-xs bg-zinc-50 border border-zinc-200">
                      <div className="space-y-1">
                        <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-400 font-mono">
                          Explain the Issue
                        </span>
                        <p className="leading-relaxed text-zinc-650">{details.explanation}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-400 font-mono">
                          Why it Matters
                        </span>
                        <p className="leading-relaxed text-zinc-650">{details.whyItMatters}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-400 font-mono">
                          SEO Impact Potential
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-700 text-xs">
                            {details.impactScore}/100 Score
                          </span>
                        </div>
                        {/* Strength meter bar */}
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-200">
                          <div
                            className="h-full rounded-full bg-violet-600"
                            style={{ width: `${details.impactScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tag Modification Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl text-xs border bg-red-50/20 border-red-200/50">
                        <span className="text-[10px] text-red-650 font-bold block uppercase tracking-wider font-mono mb-1.5">
                          Current Value
                        </span>
                        <div className="text-zinc-650 leading-relaxed font-mono truncate">
                          {(() => {
                            if (!currentValParsed) return "Empty or missing";
                            if (item.type === "social_meta" && currentValParsed.missingTags) {
                              return `Missing tags: ${currentValParsed.missingTags.join(", ")}`;
                            }
                            if (item.type === "insecure_link" && currentValParsed.insecureLinks) {
                              return `Insecure: ${currentValParsed.insecureLinks.join(", ")}`;
                            }
                            if (item.type === "image_weight") {
                              return `Oversized img: ${currentValParsed.imageUrl} (${currentValParsed.sizeKb}KB)`;
                            }
                            if (item.type === "duplicate_content") {
                              return `Duplicate ${currentValParsed.field}: "${currentValParsed.value}" shared by: ${currentValParsed.urls?.join(", ")}`;
                            }
                            if (item.type === "robots_sitemap") {
                              return `File: ${currentValParsed.path || "sitemap.xml"} - ${currentValParsed.error || "status: " + currentValParsed.statusCode || "Missing"}`;
                            }
                            if (item.type === "heading_structure") {
                              return currentValParsed.skippedDetails || `H1 Count: ${currentValParsed.h1Count}`;
                            }
                            return currentValParsed?.title ||
                              currentValParsed?.description ||
                              currentValParsed?.count ||
                              currentValParsed?.canonical ||
                              (item.type === "schema_markup" ? "Missing schema.org markup block" : "Empty attribute");
                          })()}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl relative group text-xs border bg-violet-50/10 border-violet-200">
                        <span className="text-[10px] text-violet-700 font-bold block uppercase tracking-wider font-mono mb-1.5 flex items-center justify-between">
                          <span>AI Recommendation Fix</span>
                          {isApplied && (() => {
                            let wpLink = "";
                            if (item.suggestedValue) {
                              try {
                                const parsed = JSON.parse(item.suggestedValue);
                                wpLink = parsed.wpLink || "";
                              } catch (e) {}
                            }
                            return (
                              <span className="flex items-center gap-1.5">
                                {wpLink && (
                                  <a
                                    href={wpLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-800 underline lowercase"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" /> view post
                                  </a>
                                )}
                              </span>
                            );
                          })()}
                        </span>
                        
                        <p className="font-medium leading-relaxed pr-8 text-zinc-800 font-mono break-words whitespace-pre-wrap">
                          {item.type === "internal_linking" ? (() => {
                            try {
                              const parsed = JSON.parse(item.suggestedValue);
                              return `Link to ${parsed.toUrl} with anchor text "${parsed.anchorText}". Reason: ${parsed.reason}`;
                            } catch {
                              return item.suggestedValue;
                            }
                          })() : item.suggestedValue}
                        </p>
                        
                        <button
                          onClick={() => {
                            let valToCopy = item.suggestedValue;
                            if (item.type === "internal_linking") {
                              try {
                                const parsed = JSON.parse(item.suggestedValue);
                                valToCopy = `<a href="${parsed.toUrl}">${parsed.anchorText}</a>`;
                              } catch {}
                            }
                            handleCopyText(valToCopy, item.id);
                          }}
                          className="absolute right-3 top-3 p-1.5 rounded-lg border transition-all bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800"
                          title="Copy suggestion"
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

                    {/* WordPress update/push failure callout */}
                    {item.errorMessage && (
                      <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-750 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[9px] text-red-800 font-mono">
                            {["meta_title", "meta_description"].includes(item.type) ? "Auto-Apply Failed" : "Publishing Failed"}
                          </p>
                          <p className="mt-0.5 leading-relaxed">{item.errorMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* One-Click Fix Action Bar */}
                    {item.status === "pending" && (() => {
                      const isWpConnected = !!currentSite?.wpUrl;
                      const isBlogPost = item.type === "blog_post";
                      const isMetaWithWp = ["meta_title", "meta_description"].includes(item.type) && isWpConnected;

                      return (
                        <div className="flex gap-2.5 justify-end pt-3 border-t border-zinc-100">
                          <button
                            type="button"
                            onClick={() => handleActionItem(item.id, "reject")}
                            className="px-4 py-2 border-2 border-zinc-950 bg-white text-zinc-855 font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-55"
                          >
                            Reject Fix
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleActionItem(item.id, "approve")}
                            className="px-4 py-2 border-2 border-zinc-950 bg-violet-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-700 flex items-center gap-1.5"
                          >
                            {isBlogPost && isWpConnected ? (
                              <>
                                <Zap className="w-3.5 h-3.5" /> Publish to WordPress
                              </>
                            ) : isMetaWithWp ? (
                              <>
                                <Zap className="w-3.5 h-3.5" /> Approve & Attempt Auto-Fix
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Approve & Copy Fix
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}

                    {/* If approved/applied, show integration copying option */}
                    {(isApproved || isApplied) && (
                      <div className="space-y-2.5 pt-3 border-t border-zinc-100">
                        <div className="p-3 rounded-xl border flex items-center justify-between text-xs transition-all bg-zinc-50 border-zinc-200">
                          <code className="text-xs font-mono truncate max-w-lg text-zinc-600 block pr-4">
                            {["schema_markup", "robots_sitemap"].includes(item.type)
                              ? item.suggestedValue.substring(0, 100) + "..."
                              : item.type === "internal_linking" ? (() => {
                                  try {
                                    const parsed = JSON.parse(item.suggestedValue);
                                    return `<a href="${parsed.toUrl}">${parsed.anchorText}</a>`;
                                  } catch {
                                    return item.suggestedValue;
                                  }
                                })() : item.suggestedValue}
                          </code>
                          <button
                            onClick={() => {
                              let valToCopy = item.suggestedValue;
                              if (item.type === "internal_linking") {
                                try {
                                  const parsed = JSON.parse(item.suggestedValue);
                                  valToCopy = `<a href="${parsed.toUrl}">${parsed.anchorText}</a>`;
                                } catch {}
                              }
                              handleCopyText(valToCopy, item.id + "-approved");
                            }}
                            type="button"
                            className="px-4 py-2 border-2 border-zinc-950 bg-white text-zinc-805 font-bold text-sm rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-50 shrink-0 flex items-center gap-1.5"
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
                          </button>
                        </div>
                        {isApproved && (
                          <p className="text-[11px] text-zinc-500 italic px-1 font-mono font-medium leading-relaxed mt-1">
                            This site isn&apos;t connected to WordPress, or automatic application failed/is unsupported for this tag &mdash; copy the snippet above and place it on your page.
                          </p>
                        )}
                      </div>
                    )}
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

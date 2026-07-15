import React from "react";
import { FileText, Check, Copy } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface ContentTabProps {
  currentAudit: any;
  handleActionItem: (itemId: string, action: "approve" | "reject") => void;
  previewBlogPost: any;
  setPreviewBlogPost: (post: any) => void;
  handleCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const ContentTab: React.FC<ContentTabProps> = ({
  currentAudit,
  handleActionItem,
  previewBlogPost,
  setPreviewBlogPost,
  handleCopyText,
  copiedId,
}) => {
  const contentDrafts =
    currentAudit?.items?.filter((item: any) => item.type === "blog_post") || [];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="border-b pb-4 border-zinc-100">
        <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
          <FileText className="w-5 h-5 text-violet-500" /> AI Content Suite
        </h2>
        <p className="text-sm mt-1 text-zinc-550">
          Discover keyword search gaps, draft outline items, generate article text, meta tags, schemas and FAQs.
        </p>
      </div>

      {contentDrafts.length > 0 ? (
        <Card variant="flat">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Crawled Blog Drafts Database</h3>
            <p className="text-xs mt-0.5 text-zinc-500">
              Approved blog drafts matching content gaps on crawl domain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {contentDrafts.map((item: any) => {
              const post = JSON.parse(item.suggestedValue || "{}");
              const isApplied = item.status === "applied";
              const isApproved = item.status === "approved";

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border space-y-3 transition-all border-zinc-200 bg-zinc-50/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-505">/{post.slug || "blog"}</span>
                    {isApplied ? (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Pushed to CMS
                      </span>
                    ) : isApproved ? (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                        Approved
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                        Ready for review
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs leading-snug text-zinc-800">{post.title}</h4>
                    <p
                      className="text-[11px] leading-relaxed line-clamp-3 mt-1 text-zinc-650"
                      dangerouslySetInnerHTML={{
                        __html: post.content?.substring(0, 150) + "...",
                      }}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" onClick={() => setPreviewBlogPost(post)} className="flex-1">
                      Preview Content
                    </Button>
                    {item.status === "pending" && (
                      <Button variant="primary" onClick={() => handleActionItem(item.id, "approve")}>
                        Approve Fix
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card variant="flat" className="p-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto bg-zinc-100 border-zinc-200 text-zinc-550">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-700">No blog drafts available</h3>
            <p className="text-zinc-550 text-xs mt-1">
              Complete a website crawl diagnostics run first to generate blog post drafts targeting content gaps!
            </p>
          </div>
        </Card>
      )}

      {/* Blog Post Preview Modal */}
      {previewBlogPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="border-2 border-zinc-950 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden bg-white text-zinc-700">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between border-zinc-100 bg-zinc-50/50">
              <div>
                <span className="text-[10px] text-violet-500 font-mono block mb-1">
                  Gutenberg Block HTML Content Preview
                </span>
                <h3 className="font-bold text-lg leading-snug text-zinc-900">{previewBlogPost.title}</h3>
              </div>
              <button
                onClick={() => setPreviewBlogPost(null)}
                className="p-1.5 rounded-lg border-2 border-zinc-950 transition-all shadow-sm bg-white text-zinc-400 hover:text-zinc-800"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 prose max-w-none text-xs leading-relaxed text-zinc-850">
              <div
                className="space-y-4"
                dangerouslySetInnerHTML={{ __html: previewBlogPost.content }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-2 border-zinc-100 bg-zinc-55/50">
              <Button
                variant="secondary"
                onClick={() => handleCopyText(previewBlogPost.content, "modal-copy")}
              >
                {copiedId === "modal-copy" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" /> Copied HTML
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy HTML Source
                  </>
                )}
              </Button>
              <Button variant="primary" onClick={() => setPreviewBlogPost(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

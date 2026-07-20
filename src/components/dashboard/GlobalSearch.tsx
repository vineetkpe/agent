import React, { useState, useEffect, useRef } from "react";
import { Search, Globe, AlertTriangle, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sites, setSites] = useState<any[]>([]);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Listen to Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSites([]);
      setAuditItems([]);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Perform search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setSites([]);
      setAuditItems([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSites(data.sites || []);
          setAuditItems(data.auditItems || []);
        }
      } catch (err) {
        console.error("Search query fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelectSite = (siteId: string) => {
    setIsOpen(false);
    // Use Next.js client side route reload via query parameters
    window.location.href = `/dashboard?siteId=${siteId}`;
  };

  const handleSelectAuditItem = (item: any) => {
    setIsOpen(false);
    let targetTab = "recommendations";
    if (item.type === "blog_post") {
      targetTab = "content";
    }
    window.location.href = `/dashboard?siteId=${item.siteId}&tab=${targetTab}`;
  };

  if (!isOpen) {
    // Show a small hints button in bottom corner or top bar
    return (
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 border-2 border-zinc-950 rounded-xl hover:bg-zinc-100 transition-colors bg-white font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] cursor-pointer"
      >
        <Search className="w-3.5 h-3.5" />
        Search
        <span className="bg-zinc-150 px-1.5 py-0.5 rounded text-[8px] border border-zinc-300">⌘K</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-xs p-4">
      <div
        ref={modalRef}
        className="w-full max-w-xl border-2 border-zinc-950 bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] overflow-hidden flex flex-col max-h-[70vh] animate-slide-up"
      >
        {/* Search Input Header */}
        <div className="p-4 border-b-2 border-zinc-950 flex items-center gap-3 bg-zinc-50">
          <Search className="w-5 h-5 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search sites or recommendations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none font-mono"
          />
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <span className="text-[9px] font-mono text-zinc-400 font-bold border border-zinc-300 px-1.5 py-0.5 rounded bg-white">ESC</span>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-200 transition-colors text-zinc-450 hover:text-zinc-700"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs max-h-[50vh]">
          {query.trim().length < 2 ? (
            <div className="p-6 text-center text-zinc-450 space-y-1">
              <Sparkles className="w-6 h-6 mx-auto text-violet-500 mb-1" />
              <p className="font-bold">Type to begin search</p>
              <p className="text-[10px] text-zinc-400">Search connected properties or AI optimization items.</p>
            </div>
          ) : (
            <>
              {/* Sites Matches */}
              {sites.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Connected Domains ({sites.length})
                  </span>
                  {sites.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSite(s.id)}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 flex items-center justify-between text-left transition-all"
                    >
                      <span className="font-bold text-zinc-800 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-violet-500" />
                        {s.url.replace(/^https?:\/\/(www\.)?/i, "")}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-zinc-450 font-bold">Select Domain</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Recommendations Matches */}
              {auditItems.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Audit Recommendations ({auditItems.length})
                  </span>
                  {auditItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectAuditItem(item)}
                      className="w-full p-3 rounded-xl border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 text-left transition-all flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-800 capitalize">
                          {item.type.replace("_", " ")}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-zinc-100 border text-zinc-500">
                          {item.site?.url.replace(/^https?:\/\/(www\.)?/i, "")}
                        </span>
                      </div>
                      <span className="text-zinc-500 text-[10px] truncate block">
                        {item.suggestedValue}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {sites.length === 0 && auditItems.length === 0 && (
                <div className="p-8 text-center text-zinc-400 space-y-1">
                  <AlertTriangle className="w-6 h-6 mx-auto text-amber-500" />
                  <p className="font-bold">No results found</p>
                  <p className="text-[10px] text-zinc-400">Try searching for keywords, domain names, or issues.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

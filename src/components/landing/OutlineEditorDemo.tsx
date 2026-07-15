import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { Badge } from "../ui/Badge";

export const OutlineEditorDemo: React.FC = () => {
  const [activeKeyword, setActiveKeyword] = useState<"plumber" | "insulation" | "renovation">("plumber");
  const [editorText, setEditorText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsTyping(true);
    setEditorText("");

    const outlines = {
      plumber: `TITLE: 5 Emergency Plumbing Fixes for Local Homeowners
SLUG: emergency-plumbing-fixes
METADATA: Clear guidance on stopping leaks and pressure failures.

AI OUTLINE STRUCTURE:
1. Introduction: The cost of ignoring pipe leaks.
2. Step-by-step: Mending a burst pipe with sealing tape.
3. Troubleshooting water heater warning lights.
4. When to call a certified emergency service immediately.
5. FAQ: How to locate your main shut-off valves.

[Agent Status: Draft complete, validated JSON-LD schema, ready to push!]`,
      insulation: `TITLE: How Attic Insulation Slashes Monthly Cooling Bills
SLUG: attic-insulation-cooling-cost
METADATA: Reviewing R-value metrics and installation methods.

AI OUTLINE STRUCTURE:
1. Understanding heat transfer through roofs.
2. What is R-Value? Choosing fiberglass vs spray foam.
3. Safety considerations: Airflow and mold prevention.
4. ROI Calculator: Average timeline to break even.
5. FAQ: Can you layer fresh insulation over old sheets?

[Agent Status: Outlines compiled, compressed 4 graphics, ready for CMS!]`,
      renovation: `TITLE: 3 Structural Checks Before Renovating Your Kitchen
SLUG: structural-checks-kitchen-renovation
METADATA: Avoid expensive repair disasters by reviewing load bearings.

AI OUTLINE STRUCTURE:
1. Load-bearing walls vs partition drywall frames.
2. Mapping plumbing lines and electrical outlets before tearing walls.
3. Ventilation routing specs for professional ranges.
4. Setting a realistic contingency budget buffer (15%).
5. FAQ: Do you need a permit to remove partition studs?

[Agent Status: Draft review complete, FAQ markup ready to inject!]`,
    };

    const targetText = outlines[activeKeyword];
    let idx = 0;

    const timer = setInterval(() => {
      if (idx < targetText.length) {
        setEditorText(targetText.substring(0, idx + 15));
        idx += 15;
      } else {
        setEditorText(targetText);
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [activeKeyword]);

  return (
    <section id="editor" className="py-16 px-6 max-w-6xl mx-auto w-full border-t-2 border-zinc-200">
      {/* Demo Badge */}
      <div className="flex justify-start mb-2">
        <Badge variant="amber">Interactive Demo -- Illustrative</Badge>
      </div>

      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs text-violet-650 font-bold tracking-wider uppercase font-mono">
          Autonomous Content Blueprinting
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-950 font-mono">
          AI Outline Live Editor Simulator
        </h2>
        <p className="text-sm mt-1.5 text-zinc-550 leading-relaxed font-sans">
          Select a target keyword query on the left, and watch the growth employee compile SEO headings, FAQs, and article drafts in the editor workspace in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Keyword selector cards */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-zinc-500 block">
            Select Search Intent Query:
          </span>

          <button
            onClick={() => setActiveKeyword("plumber")}
            type="button"
            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1 shadow-retro-sm ${
              activeKeyword === "plumber"
                ? "bg-violet-50 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white border-zinc-200 hover:border-zinc-350"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider font-mono text-violet-600">
                Keyword Group A
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Vol: 1,400/mo</span>
            </div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">&quot;emergency plumbing fixes&quot;</h4>
            <p className="text-[11px] leading-relaxed text-zinc-550 mt-1">Targets urgent residential pipe repair volume.</p>
          </button>

          <button
            onClick={() => setActiveKeyword("insulation")}
            type="button"
            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1 shadow-retro-sm ${
              activeKeyword === "insulation"
                ? "bg-violet-50 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white border-zinc-200 hover:border-zinc-350"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider font-mono text-violet-600">
                Keyword Group B
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Vol: 850/mo</span>
            </div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">&quot;attic insulation cooling cost&quot;</h4>
            <p className="text-[11px] leading-relaxed text-zinc-555 mt-1">Targets homeowners seeking energy audit upgrades.</p>
          </button>

          <button
            onClick={() => setActiveKeyword("renovation")}
            type="button"
            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1 shadow-retro-sm ${
              activeKeyword === "renovation"
                ? "bg-violet-50 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white border-zinc-200 hover:border-zinc-350"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider font-mono text-violet-600">
                Keyword Group C
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Vol: 320/mo</span>
            </div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">&quot;structural kitchen checks&quot;</h4>
            <p className="text-[11px] leading-relaxed text-zinc-550 mt-1">Targets kitchen framing and permit queries.</p>
          </button>
        </div>

        {/* Typewriting workspace editor */}
        <div className="lg:col-span-2 rounded-2xl border-2 border-zinc-950 bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
          {/* Editor Top Bar */}
          <div className="bg-zinc-900 px-4 py-2 border-b-2 border-zinc-950 flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-violet-405 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Growth Article Generator Pad</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase">
              {isTyping ? "Writing draft..." : "Compilation finished"}
            </span>
          </div>

          {/* Document page */}
          <div className="p-6 min-h-[300px] max-h-[380px] overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-800 bg-zinc-50/50">
            {isTyping && (
              <div className="flex items-center gap-2 text-violet-600 mb-4 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                <span>AI Employee writing outline. Validating search intent vectors...</span>
              </div>
            )}
            <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-700 leading-relaxed font-bold">
              {editorText}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
export default OutlineEditorDemo;

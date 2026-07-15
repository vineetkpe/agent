import React from "react";

export const WorkflowSteps: React.FC = () => {
  return (
    <section className="py-20 px-6 border-t-2 border-zinc-950 bg-zinc-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs text-violet-650 font-bold tracking-widest uppercase font-mono">Workflow Steps</span>
          <h2 className="text-3xl font-extrabold mt-1 tracking-tight text-zinc-950 font-mono">
            How HeyDrona Operates
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all bg-white border-zinc-950 text-zinc-700 font-bold">
              01
            </div>
            <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">Connect Domain</h4>
            <p className="text-xs leading-relaxed text-zinc-650">
              Enter your landing domain. Optionally establish REST connection credentials for safe publishing.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all bg-white border-zinc-950 text-zinc-700 font-bold">
              02
            </div>
            <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">Automated Audit</h4>
            <p className="text-xs leading-relaxed text-zinc-650">
              The crawler runs through subpages, auditing elements, titles, speeds, and links.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all bg-white border-zinc-950 text-zinc-700 font-bold">
              03
            </div>
            <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">Review Explanations</h4>
            <p className="text-xs leading-relaxed text-zinc-650">
              Read AI descriptions, check why metrics matter, and review generated blog outlines.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all bg-white border-zinc-950 text-zinc-700 font-bold">
              04
            </div>
            <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">One-Click Deploy</h4>
            <p className="text-xs leading-relaxed text-zinc-650">
              Click &quot;Apply&quot; to instantly push blog updates and metadata live to your CMS.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
export default WorkflowSteps;

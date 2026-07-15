import React, { useState } from "react";
import { Badge } from "../ui/Badge";

export const SevenDayScheduler: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">("mon");

  const getSchedulerActions = (day: string) => {
    switch (day) {
      case "mon":
        return [
          { time: "09:00 AM", text: "Crawler wakes up. Scans main sitemap URLs for crawl errors.", status: "Done" },
          { time: "11:30 AM", text: "Audits meta descriptions on 3 secondary pages. Generates suggestions.", status: "Done" },
          { time: "03:00 PM", text: "Compiles local competitor backlink gaps. Flags 2 referral opportunities.", status: "Done" },
        ];
      case "tue":
        return [
          { time: "10:00 AM", text: "Scans outbound links for 404 targets. Replaces 1 broken anchor tag.", status: "Done" },
          { time: "01:30 PM", text: "Injects semantic internal links within blog archive database.", status: "Done" },
          { time: "04:15 PM", text: "Compresses 12 heavy png assets. Reduces page load time by 320ms.", status: "Done" },
        ];
      case "wed":
        return [
          { time: "09:15 AM", text: "Performs target keyword tracking lookup. Compares rankings placement.", status: "Done" },
          { time: "02:00 PM", text: "Researches content gaps. Selects high-intent search query and compiles outline.", status: "Done" },
          { time: "05:00 PM", text: "Writes full article draft with integrated FAQ JSON-LD schemas.", status: "Done" },
        ];
      case "thu":
        return [
          { time: "11:00 AM", text: "Inbound backlink quality evaluation. Audits incoming referral nodes.", status: "Done" },
          { time: "03:30 PM", text: "Prepares weekly email growth digest template. Validates ranking differences.", status: "Done" },
          { time: "06:00 PM", text: "Verifies connected CMS REST API connection handshake.", status: "Done" },
        ];
      case "fri":
        return [
          { time: "08:30 AM", text: "Auto-deploys approved meta tag patches live to connected website.", status: "Done" },
          { time: "12:00 PM", text: "Publishes generated blog post article as Gutenberg draft.", status: "Done" },
          { time: "04:00 PM", text: "Dispatches weekly Growth employee report email to site owner.", status: "Done" },
        ];
      default:
        return [
          { time: "09:00 AM", text: "Background crawler listening mode active. Validating site headers.", status: "Done" },
          { time: "02:00 PM", text: "Scans core security logs. Confirms DB backups are verified.", status: "Done" },
        ];
    }
  };

  return (
    <section id="scheduler" className="py-16 px-6 max-w-6xl mx-auto w-full border-t-2 border-zinc-200">
      {/* Demo Badge */}
      <div className="flex justify-start mb-2">
        <Badge variant="amber">Interactive Demo -- Illustrative</Badge>
      </div>

      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs text-violet-650 font-bold tracking-wider uppercase font-mono">
          Autonomous Action Schedule
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-950 font-mono">
          7-Day Growth Agent Logs
        </h2>
        <p className="text-sm mt-1.5 text-zinc-550 leading-relaxed font-sans">
          Click on any day of the week below to inspect the hour-by-hour task list the AI Employee executes automatically to drive traffic.
        </p>
      </div>

      {/* Day Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {[
          { id: "mon", label: "Monday" },
          { id: "tue", label: "Tuesday" },
          { id: "wed", label: "Wednesday" },
          { id: "thu", label: "Thursday" },
          { id: "fri", label: "Friday" },
          { id: "sat", label: "Saturday" },
          { id: "sun", label: "Sunday" },
        ].map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day.id as any)}
            type="button"
            className={`py-3 px-4 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono text-center transition-all shadow-retro-sm ${
              selectedDay === day.id
                ? "bg-violet-600 border-zinc-950 text-white shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-350"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Day Schedule timeline list */}
      <div className="rounded-2xl border-2 p-6 border-zinc-950 bg-white shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-zinc-500 block mb-6">
          Agent timeline Checklist for {selectedDay.toUpperCase()}
        </span>

        <div className="relative pl-6 border-l-2 border-zinc-950 space-y-6">
          {getSchedulerActions(selectedDay).map((action, idx) => (
            <div key={idx} className="relative group animate-fade-in">
              <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2 bg-white border-zinc-950">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wide">
                    {action.time}
                  </span>
                  <h4 className="font-bold text-sm text-zinc-800 mt-0.5">{action.text}</h4>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 self-start sm:self-center">
                  ✓ {action.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default SevenDayScheduler;

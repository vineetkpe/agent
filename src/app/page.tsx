"use client";

import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import CrawlerSandbox from "@/components/landing/CrawlerSandbox";
import LiveUrlStreamer from "@/components/landing/LiveUrlStreamer";
import OutlineEditorDemo from "@/components/landing/OutlineEditorDemo";
import SevenDayScheduler from "@/components/landing/SevenDayScheduler";
import FeatureGrid from "@/components/landing/FeatureGrid";
import WorkflowSteps from "@/components/landing/WorkflowSteps";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col selection:bg-violet-500 selection:text-white overflow-x-hidden font-sans relative retro-grid bg-zinc-50 text-zinc-800">
      {/* Background glow overlay */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] -z-10 pointer-events-none transition-opacity duration-300 bg-violet-500/5" />

      <Header />
      <Hero />
      <CrawlerSandbox />
      <LiveUrlStreamer />
      <OutlineEditorDemo />
      <SevenDayScheduler />
      <FeatureGrid />
      <WorkflowSteps />
      <Pricing />
      <Faq />
      <Footer />
    </div>
  );
}

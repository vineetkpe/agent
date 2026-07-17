"use client";

import dynamic from "next/dynamic";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import WorkflowSteps from "@/components/landing/WorkflowSteps";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

const CrawlerSandbox = dynamic(() => import("@/components/landing/CrawlerSandbox"), { ssr: false });
const LiveUrlStreamer = dynamic(() => import("@/components/landing/LiveUrlStreamer"), { ssr: false });
const OutlineEditorDemo = dynamic(() => import("@/components/landing/OutlineEditorDemo"), { ssr: false });
const Faq = dynamic(() => import("@/components/landing/Faq"), { ssr: false });

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
      <FeatureGrid />
      <WorkflowSteps />
      <Pricing />
      <Faq />
      <Footer />
    </div>
  );
}

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AIEditingModels from "@/components/AIEditingModels";
import WorkflowAutomation from "@/components/WorkflowAutomation";
import AIEditor from "@/components/AIEditor";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <AIEditingModels />
      <WorkflowAutomation />
      <AIEditor />
      <CTA />
      <Footer />
    </main>
  );
}

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { InteractiveOrb } from "@/components/ui/InteractiveOrb";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { 
  Upload, 
  MessageSquare, 
  Shield, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Database
} from "lucide-react";

const Landing = () => {
  const marqueeQueries = [
    "What was the decision on our pricing model?",
    "Where is the Notion doc for the new API?",
    "What did Sarah say in Slack about staging?",
    "What changed in the latest pull request on the frontend repo?",
    "How do I request a vacation?",
    "Summarize the Confluence wiki on the AWS migration.",
    "Who is the on-call engineer this week?",
    "What was the latest update in the #engineering Slack channel?",
    "What database indexes did we add?",
    "Where is the Notion doc for the new API?",
    "What did Sarah say in Slack about staging?",
    "What changed in the latest pull request on the frontend repo?",
    "How do I request a vacation?",
    "Summarize the Confluence wiki on the AWS migration.",
    "Who is the on-call engineer this week?",
    "What database indexes did we add?"
  ];

  return (
    <div className="relative min-h-screen bg-bg text-fg overflow-x-hidden font-sans selection:bg-purple-500/20">
      {/* Subtle Noise overlay */}
      <div className="noise-bg pointer-events-none fixed inset-0 z-50 opacity-[0.015] dark:opacity-[0.02]" />

      <Header />

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-40 md:pt-48 min-h-[90vh] justify-center">
          {/* Animated Aurora Radial Glows */}
          <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-60 blur-[130px] dark:opacity-40" 
               style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.12) 40%, transparent 70%)" }} />
          <div className="pointer-events-none absolute right-10 top-40 -z-10 h-[400px] w-[400px] rounded-full opacity-40 blur-[120px] dark:opacity-30" 
               style={{ background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)" }} />

          <div className="grid w-full items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
            <div className="order-2 text-center md:order-1 md:text-left space-y-8">
              <ScrollReveal direction="up" delay={0.1}>
                <div className="text-[0.7rem] font-mono text-fg-secondary/80 uppercase tracking-widest select-none">
                  AI Powered Organizational Brain
                </div>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.2} className="space-y-4">
                <h1 className="font-display text-5xl md:text-7xl lg:text-[4.8rem] font-light leading-[1.05] tracking-[-0.04em]">
                  Build the<br />company memory<br /><span className="amber-grad font-normal inline-block whitespace-nowrap pr-[0.2em] pb-[0.1em]">that never forgets.</span>
                </h1>
                <p className="mx-auto md:mx-0 max-w-md text-[1.05rem] md:text-[1.1rem] leading-relaxed text-fg-secondary">
                  Stop losing critical business decisions, Notion docs, Slack threads, Confluence wikis, and GitHub repos. Memorix captures your personal or team's collective intelligence and answers questions instantly.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.3} className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/signup">
                  <Button className="group h-12 px-8 rounded-full bg-gradient-to-r from-[#e8a13c] to-[#d8729a] hover:opacity-90 text-white font-semibold text-sm shadow-xl shadow-[#e8a13c]/15 hover:scale-102 transition-all duration-300 border-0">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/docs">
                  <Button variant="outline" className="h-12 px-8 rounded-full border border-border bg-transparent hover:bg-fg/5 dark:hover:bg-white/5 text-fg font-medium text-sm transition-all hover:scale-102">
                    Read Documentation
                  </Button>
                </Link>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.4}>
                <p className="font-mono text-xs tracking-wide text-fg-secondary/70">
                  Secure. Workspace-Isolated. Native-Reranking.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="up" delay={0.25} className="order-1 flex justify-center md:order-2">
              <div className="relative aspect-square w-[75vw] max-w-[400px] md:max-w-[450px]">
                <InteractiveOrb />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Marquee Section */}
        <section className="relative border-y border-border py-8 bg-bg-secondary/20 overflow-hidden">
          <p className="mb-6 text-center font-mono text-[0.65rem] tracking-[0.25em] text-fg-secondary/60 uppercase">
            Ask your organizational memory anything
          </p>
          <div className="relative w-full overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
            <div className="flex w-max animate-marquee gap-6">
              {marqueeQueries.map((query, index) => (
                <span 
                  key={index} 
                  className="whitespace-nowrap rounded-full border border-border bg-bg px-6 py-2.5 text-sm font-medium text-fg-secondary hover:text-fg hover:border-fg-secondary transition-colors duration-300"
                >
                  {query}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-32">
          <ScrollReveal className="mb-20 max-w-2xl">
            <p className="kicker mb-4 text-xs font-mono uppercase tracking-wider text-purple-500">Why it is powerful</p>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] font-light leading-[1.05] tracking-[-0.01em]">
              A centralized intelligence layer.<br />
              <span className="text-fg-secondary">Synced, secure, and instant.</span>
            </h2>
          </ScrollReveal>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Bento Card 1: Smart Ingestion */}
            <ScrollReveal delay={0.0} className="group md:col-span-2 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-bg-secondary/40 p-8 hover:bg-bg-secondary/60 transition-all duration-300">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500" style={{ background: "#3b82f6" }} />
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform duration-300">
                <Upload className="h-6 w-6" />
              </div>
              <div className="mt-24 space-y-3">
                <h3 className="font-display text-2xl font-light">Smart Ingestion Pipeline</h3>
                <p className="text-sm leading-relaxed text-fg-secondary max-w-lg">
                  Drag and drop PDFs or plain text documents. Memorix automatically processes, recursively chunks, and indexes your files into Pinecone in seconds.
                </p>
              </div>
              <div className="mt-6 h-px w-0 bg-blue-500/50 transition-all duration-500 group-hover:w-16" />
            </ScrollReveal>

            {/* Bento Card 2: AI Conversational Chat */}
            <ScrollReveal delay={0.1} className="group md:col-span-1 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-bg-secondary/40 p-8 hover:bg-bg-secondary/60 transition-all duration-300">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500" style={{ background: "#8b5cf6" }} />
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-105 transition-transform duration-300">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="mt-24 space-y-3">
                <h3 className="font-display text-2xl font-light">Contextual RAG Chat</h3>
                <p className="text-sm leading-relaxed text-fg-secondary">
                  Chat naturally with your documents. The Gemini-powered interface answers your questions with direct source citations.
                </p>
              </div>
              <div className="mt-6 h-px w-0 bg-purple-500/50 transition-all duration-500 group-hover:w-16" />
            </ScrollReveal>

            {/* Bento Card 3: Integrations */}
            <ScrollReveal delay={0.15} className="group md:col-span-1 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-bg-secondary/40 p-8 hover:bg-bg-secondary/60 transition-all duration-300">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500" style={{ background: "#ec4899" }} />
              <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="mt-24 space-y-3">
                <h3 className="font-display text-2xl font-light">Third-Party Sync</h3>
                <p className="text-sm leading-relaxed text-fg-secondary">
                  Connect your team's Notion, Slack channels, Confluence wikis, and GitHub repos. Retrieve all knowledge seamlessly in one interface.
                </p>
              </div>
              <div className="mt-6 h-px w-0 bg-pink-500/50 transition-all duration-500 group-hover:w-16" />
            </ScrollReveal>

            {/* Bento Card 4: Access Controls */}
            <ScrollReveal delay={0.2} className="group md:col-span-2 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-bg-secondary/40 p-8 hover:bg-bg-secondary/60 transition-all duration-300">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500" style={{ background: "#14b8a6" }} />
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 group-hover:scale-105 transition-transform duration-300">
                <Shield className="h-6 w-6" />
              </div>
              <div className="mt-24 space-y-3">
                <h3 className="font-display text-2xl font-light">Workspace Isolation</h3>
                <p className="text-sm leading-relaxed text-fg-secondary max-w-lg">
                  Complete tenant and workspace isolation. Personal and team knowledge bases remain strictly separated. Secure Pinecone namespaces guarantee data privacy.
                </p>
              </div>
              <div className="mt-6 h-px w-0 bg-teal-500/50 transition-all duration-500 group-hover:w-16" />
            </ScrollReveal>
          </div>
        </section>

        {/* Benefits Walkthrough */}
        <section className="relative py-28 border-t border-border bg-bg-secondary/10 overflow-hidden">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="space-y-8">
                <ScrollReveal className="space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-[1.05] tracking-[-0.01em]">
                    Decision Supremacy.<br />
                    <span className="text-fg-secondary">Knowledge that adapts.</span>
                  </h2>
                  <p className="text-base leading-relaxed text-fg-secondary max-w-md">
                    Documents document the past. Decisions shape the present. With Memorix, when you log a new decision, the AI automatically prioritizes it over older documentation.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.1} className="space-y-4">
                  <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-bg/50">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Decisions Override Documents</h4>
                      <p className="text-xs text-fg-secondary mt-1">If a PDF from 2024 conflicts with a logged Decision from today, the engine honors the decision.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-bg/50">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Semantic Synchronization</h4>
                      <p className="text-xs text-fg-secondary mt-1">Decisions are automatically chunked, embedded, and synced directly to Pinecone vector spaces.</p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Graphical Visualizer */}
              <ScrollReveal direction="up" delay={0.2} className="relative">
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-2xl opacity-40 blur-3xl" 
                     style={{ background: "radial-gradient(circle at 70% 30%, rgba(139,92,246,0.15), transparent 60%)" }} />
                <div className="rounded-2xl border border-border bg-gradient-to-b from-bg-secondary to-bg p-6 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
                      <div>
                        <p className="text-xs font-semibold">Decision Engine</p>
                        <p className="text-[0.6rem] font-mono text-fg-secondary">PRIORITY: ACTIVE DECISION</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 font-mono text-[0.6rem] text-purple-500 uppercase tracking-wider">RESOLVED</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="self-end bg-fg text-bg dark:bg-white dark:text-black rounded-xl rounded-tr-none px-4 py-2.5 max-w-[85%] ml-auto">
                      What is our policy on remote work setup expense limits?
                    </div>
                    
                    <div className="self-start border border-border bg-bg rounded-xl rounded-tl-none p-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-[0.65rem] text-amber-500 font-semibold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" /> Decision Supremacy Override
                      </div>
                      <p className="text-fg-secondary leading-relaxed">
                        According to <span className="text-fg font-medium underline decoration-purple-500">Employee_Handbook.pdf</span> (2024), the budget was $500. However, a new <span className="text-fg font-medium underline decoration-indigo-500">Decision #242</span> (June 2026) specifies:
                      </p>
                      <blockquote className="border-l-2 border-purple-500 pl-3 italic text-fg-secondary my-2">
                        "The remote work equipment allowance is increased to $1,000 for all engineers."
                      </blockquote>
                      <p className="text-[0.65rem] text-fg-secondary/70 font-mono">
                        Sources: Decision #242 (100% match) · Employee_Handbook.pdf (82% match)
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Integrations Ecosystem Section */}
        <section className="relative py-32 border-t border-border overflow-hidden bg-bg">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-[0.03] blur-[100px] bg-gradient-to-tr from-purple-500 to-indigo-500" />
          
          <div className="mx-auto max-w-5xl px-6 text-center">
            <ScrollReveal>
              <p className="kicker mb-4 text-xs font-mono uppercase tracking-wider text-purple-500">Connected Ecosystem</p>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.01em] mb-6">
                Sync your entire stack in seconds
              </h2>
              <p className="text-base text-fg-secondary max-w-2xl mx-auto mb-20 leading-relaxed">
                Connect your organization's existing knowledge silos. Memorix automatically ingests, chunks, and vectorizes content from the tools your team already uses.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.1} className="relative flex items-center justify-center min-h-[300px]">
              {/* Center: Memorix Logo/Icon */}
              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-bg border border-border shadow-2xl">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <Database className="h-6 w-6" />
                </div>
              </div>

              {/* Connecting Lines (SVG) */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-20 dark:opacity-40" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
                <path d="M 400 150 L 250 75" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                <path d="M 400 150 L 550 75" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                <path d="M 400 150 L 250 225" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
                <path d="M 400 150 L 550 225" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
              </svg>

              {/* Floating Logos */}
              {/* Notion (Top Left) */}
              <div className="absolute -translate-x-[150px] -translate-y-[75px] flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-black/10 shadow-lg hover:scale-110 transition-transform duration-300">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" alt="Notion" className="h-8 w-8 object-contain" />
              </div>
              
              {/* Slack (Top Right) */}
              <div className="absolute translate-x-[150px] -translate-y-[75px] flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-black/10 shadow-lg hover:scale-110 transition-transform duration-300">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/slack/slack-original.svg" alt="Slack" className="h-8 w-8 object-contain" />
              </div>

              {/* Confluence (Bottom Left) */}
              <div className="absolute -translate-x-[150px] translate-y-[75px] flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-black/10 shadow-lg hover:scale-110 transition-transform duration-300">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/confluence/confluence-original.svg" alt="Confluence" className="h-8 w-8 object-contain" />
              </div>

              {/* GitHub (Bottom Right) */}
              <div className="absolute translate-x-[150px] translate-y-[75px] flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-black/10 shadow-lg hover:scale-110 transition-transform duration-300">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg" alt="GitHub" className="h-8 w-8 object-contain" />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mx-auto max-w-3xl px-6 py-32">
          <ScrollReveal className="text-center mb-16">
            <p className="kicker mb-4 text-xs font-mono uppercase tracking-wider text-purple-500">Learn more</p>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.01em]">
              Frequently Asked Questions
            </h2>
          </ScrollReveal>

          <ScrollReveal className="divide-y divide-border border-y border-border">
            <details className="group py-6 cursor-pointer outline-none">
              <summary className="flex items-center justify-between gap-4 text-base font-semibold text-fg/90 transition-colors duration-300 group-hover:text-fg">
                How does Memorix secure company data?
                <span className="font-display text-xl text-fg-secondary/50 group-open:-rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-fg-secondary max-w-prose">
                Data privacy is our top priority. We use Supabase Row-Level Security (RLS) to enforce strict tenant isolation in PostgreSQL. In Pinecone, every company's role has its own dedicated namespace, ensuring zero data leakage between roles or tenants.
              </p>
            </details>

            <details className="group py-6 cursor-pointer outline-none">
              <summary className="flex items-center justify-between gap-4 text-base font-semibold text-fg/90 transition-colors duration-300 group-hover:text-fg">
                Can we connect our existing knowledge repositories?
                <span className="font-display text-xl text-fg-secondary/50 group-open:-rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-fg-secondary max-w-prose">
                Yes. In addition to raw document uploads (PDF, DOCX, TXT), Memorix supports full OAuth 2.0 integrations with Notion workspaces, Slack channels, Confluence wiki spaces, and GitHub repositories. All data is automatically synced and vectorized.
              </p>
            </details>

            <details className="group py-6 cursor-pointer outline-none">
              <summary className="flex items-center justify-between gap-4 text-base font-semibold text-fg/90 transition-colors duration-300 group-hover:text-fg">
                What does "Decision Supremacy" mean?
                <span className="font-display text-xl text-fg-secondary/50 group-open:-rotate-45 transition-transform duration-300">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-fg-secondary max-w-prose">
                It means that when answering user questions, the AI decision engine explicitly checks for recently recorded team Decisions. If there is a newer decision that conflicts with information in a synced PDF or document, the AI will prioritize the newer decision, keeping your knowledge base aligned with reality.
              </p>
            </details>
          </ScrollReveal>
        </section>

        {/* Final CTA Section */}
        <section className="relative overflow-hidden py-32 text-center border-t border-border">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[130px] dark:opacity-30" 
               style={{ background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(99,102,241,0.08) 50%, transparent 72%)" }} />
          
          <ScrollReveal className="max-w-2xl mx-auto space-y-6 px-6">
            <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.02] tracking-[-0.03em] text-balance">
              Preserve your team's <span className="amber-grad font-normal">genius.</span>
            </h2>
            <p className="text-base text-fg-secondary max-w-md mx-auto">
              Join forward-thinking companies building their secure organizational brain with Memorix.
            </p>
            <div className="pt-6">
              <Link to="/signup">
                <Button className="h-14 px-10 rounded-full bg-fg text-bg hover:bg-fg/90 dark:bg-white dark:text-black dark:hover:bg-gray-100 font-semibold text-base shadow-2xl shadow-purple-500/20 hover:scale-102 transition-transform duration-300">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/10 dark:border-white/5 bg-bg px-6 py-8 relative select-none">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-fg-secondary/80">
          <div className="flex items-center gap-2">
            {/* Premium 3D Isometric Memory Cube Logo Icon */}
            <svg className="w-5 h-5 filter drop-shadow-[0_1px_5px_rgba(168,85,247,0.45)]" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="footCubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                    <linearGradient id="footCubeFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
                <path d="M6 10L16 16V28L6 22V10Z" fill="url(#footCubeGrad)" opacity="0.9" />
                <path d="M26 10L16 16V28L26 22V10Z" fill="#6b21a8" opacity="0.85" />
                <path d="M16 4L26 10L16 16L6 10L16 4Z" fill="url(#footCubeFaceGrad)" />
                <path d="M16 10L21 13L16 16L11 13L16 10Z" fill="#ffffff" opacity="0.45" />
            </svg>
            <span className="font-display text-base font-bold text-fg">Memorix</span>
          </div>
          <p className="font-sans text-xs tracking-wide text-fg-secondary/70">
            The secure knowledge memory engine.
          </p>
          <p className="font-mono text-[10px] text-fg-secondary/50">
            © 2026 Memorix Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

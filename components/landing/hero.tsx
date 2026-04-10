'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, MessageSquare, FileText, Globe, Zap, Shield, BarChart3, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

function TypingText({ texts, className }: { texts: string[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[index]
    if (!deleting && displayed.length < current.length) {
      const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60)
      return () => clearTimeout(t)
    }
    if (!deleting && displayed.length === current.length) {
      const t = setTimeout(() => setDeleting(true), 2000)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false)
      setIndex((i) => (i + 1) % texts.length)
    }
  }, [displayed, deleting, index, texts])

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* === Animated Background Layer === */}

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [animation:grid-drift_20s_linear_infinite]" />

      {/* Radial fade over grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_70%)]" />

      {/* Floating orb — top left */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[100px] [animation:orb-float_8s_ease-in-out_infinite]" />

      {/* Floating orb — bottom right */}
      <div className="absolute -bottom-40 -right-20 w-[450px] h-[450px] rounded-full bg-blue-500/10 blur-[120px] [animation:orb-float_11s_ease-in-out_infinite_reverse]" />

      {/* Floating orb — center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-cyan-500/8 blur-[80px] [animation:orb-float_14s_ease-in-out_infinite_1s]" />

      {/* Particle dots */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {[
          { top: '12%', left: '8%',  size: 3,   delay: '0s',    dur: '6s'  },
          { top: '25%', left: '85%', size: 2,   delay: '1s',    dur: '7s'  },
          { top: '55%', left: '5%',  size: 2.5, delay: '2s',    dur: '5s'  },
          { top: '70%', left: '78%', size: 3.5, delay: '0.5s',  dur: '9s'  },
          { top: '40%', left: '92%', size: 2,   delay: '3s',    dur: '6.5s'},
          { top: '85%', left: '20%', size: 3,   delay: '1.5s',  dur: '8s'  },
          { top: '15%', left: '55%', size: 2,   delay: '4s',    dur: '7.5s'},
          { top: '60%', left: '45%', size: 2.5, delay: '2.5s',  dur: '5.5s'},
          { top: '30%', left: '30%', size: 2,   delay: '0.8s',  dur: '10s' },
          { top: '90%', left: '65%', size: 3,   delay: '3.5s',  dur: '6s'  },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-foreground/20"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animationName: 'particle-blink',
              animationDuration: p.dur,
              animationDelay: p.delay,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      {/* Diagonal sweep shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 [animation:shimmer-sweep_12s_ease-in-out_infinite]" />

      <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-36 lg:py-44">
        <div className="flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2 text-sm text-foreground font-medium shadow-sm">
            <Sparkles className="w-4 h-4" />
            100% Free -- All Premium Features Included
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in [animation-delay:100ms] max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl text-balance leading-[1.05]">
            AI Agents That
            <br />
            <TypingText
              texts={['Know Your Business', 'Answer Instantly', 'Never Sleep', 'Delight Customers']}
              className="text-muted-foreground"
            />
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in [animation-delay:200ms] max-w-xl text-lg text-muted-foreground leading-relaxed md:text-xl">
            Train a chatbot on your documents, websites, and text. Deploy it anywhere in minutes.
          </p>

          {/* CTA */}
          <div className="animate-fade-in [animation-delay:300ms] flex flex-col sm:flex-row items-center gap-4">
            <Button size="lg" className="h-13 px-10 text-base font-semibold rounded-xl shadow-lg shadow-foreground/10 hover:shadow-xl hover:shadow-foreground/15 transition-all" asChild>
              <Link href="/auth/sign-up">
                Start Building Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-13 px-10 text-base rounded-xl" asChild>
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Chat preview */}
          <div className="animate-slide-up [animation-delay:400ms] mt-12 w-full max-w-2xl">
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/5 overflow-hidden">
              {/* Window chrome */}
              <div className="border-b border-border px-5 py-3.5 flex items-center gap-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-border" />
                  <div className="w-3 h-3 rounded-full bg-border" />
                  <div className="w-3 h-3 rounded-full bg-border" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded-md bg-muted px-4 py-1 text-xs text-muted-foreground font-mono">
                    unibot.app/playground
                  </div>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-5">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-br-sm bg-foreground px-4 py-3 text-sm text-background font-medium">
                    How do I reset my password?
                  </div>
                </div>
                {/* Bot message */}
                <div className="flex items-start gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="max-w-sm rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm text-foreground leading-relaxed">
                    {"Go to Settings > Account > Change Password. I can also send you a reset link if you'd prefer!"}
                  </div>
                </div>
                {/* Input mock */}
                <div className="flex items-center gap-3 mt-1 rounded-xl border border-border bg-background px-4 py-3.5">
                  <span className="text-sm text-muted-foreground flex-1">Ask anything about your business...</span>
                  <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-background" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFeatures() {
  const features = [
    {
      icon: FileText,
      title: 'Train on Your Data',
      description: 'Upload PDFs, documents, or paste text. Your chatbot learns and gives accurate, context-aware answers.',
    },
    {
      icon: Globe,
      title: 'Embed Anywhere',
      description: 'One line of code. Chat bubble, iframe, or direct link -- your chatbot works everywhere.',
    },
    {
      icon: BarChart3,
      title: 'Track Conversations',
      description: 'See every conversation in real time. Understand what your users need and how the bot performs.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Powered by state-of-the-art AI. Sub-second response times with streaming for instant feedback.',
    },
    {
      icon: Shield,
      title: 'Secure by Default',
      description: 'Row-level security, encrypted data, and your content never leaves your private scope.',
    },
    {
      icon: Sparkles,
      title: 'Zero Cost',
      description: 'Every feature is free. No credits, no limits, no upgrade prompts. Build as many bots as you want.',
    },
  ]

  return (
    <section id="features" className="py-28 md:py-36 border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-20">
          <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Features</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
            Everything to build AI agents
          </h2>
          <p className="max-w-lg text-muted-foreground text-lg leading-relaxed">
            Powerful tools that make deploying intelligent chatbots effortless.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 hover:bg-muted/30 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-foreground">
                <feature.icon className="w-5 h-5 text-background" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingHowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Create a Chatbot',
      description: 'Name it, set its personality and system prompt, and pick an AI model.',
    },
    {
      step: '02',
      title: 'Add Your Data',
      description: 'Upload files, paste text, or add website URLs. Your bot learns everything you provide.',
    },
    {
      step: '03',
      title: 'Deploy Anywhere',
      description: 'Grab the embed code or share link. Your chatbot is live and ready for customers.',
    },
  ]

  return (
    <section id="how-it-works" className="py-28 md:py-36 bg-muted/20 border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-20">
          <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
            Live in three steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((item, i) => (
            <div key={item.step} className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-foreground text-background text-xl font-bold">
                  {item.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-[calc(100%+2rem)] h-px bg-border -translate-y-1/2" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} All rights reserved by{' '}
          <span className="font-semibold text-foreground">Team UniBot</span>
        </p>
      </div>
    </footer>
  )
}

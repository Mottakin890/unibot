import { LandingHeader } from '@/components/landing/header'
import { LandingHero, LandingFeatures, LandingHowItWorks, LandingFooter } from '@/components/landing/hero'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-svh bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
      </main>
      <LandingFooter />
    </div>
  )
}

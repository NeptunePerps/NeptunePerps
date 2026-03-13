import { LandingHeader } from "@/components/landing-header";
import { LandingHero } from "@/components/landing-hero";
import { FeatureCards } from "@/components/feature-cards";
import { HowGaslessWorks } from "@/components/how-gasless-works";
import { MicroOrderBooksSection } from "@/components/micro-order-books-section";
import { HowItWorksBento } from "@/components/how-it-works-bento";
import { DeveloperPreviewSection } from "@/components/developer-preview-section";
import { BuiltDifferentSection } from "@/components/built-different-section";
import { LandingFooter } from "@/components/landing-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-white antialiased overflow-x-[clip]" id="top">
      <LandingHeader />

      <main className="flex-1">
        <LandingHero />

        <div className="max-w-7xl lg:max-w-[80rem] mx-auto px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* <FeatureCards /> */}

        <div className="max-w-7xl lg:max-w-[80rem] mx-auto px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <HowGaslessWorks />

        <div className="max-w-7xl lg:max-w-[80rem] mx-auto px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <MicroOrderBooksSection />

        <div className="max-w-7xl lg:max-w-[80rem] mx-auto px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <HowItWorksBento />

        <div className="max-w-7xl lg:max-w-[80rem] mx-auto px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <BuiltDifferentSection />

        <div className="max-w-7xl lg:max-w-[80rem] mx-auto px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <DeveloperPreviewSection />
      </main>

      <LandingFooter />
    </div>
  );
}

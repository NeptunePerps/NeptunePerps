import Link from "next/link";
import { NeptuneLogo } from "@/components/neptune-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030407] text-white px-6">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex mb-8">
          <NeptuneLogo size="lg" className="h-16" />
        </Link>
        <h1 className="text-2xl font-display font-bold text-white mb-2">Page not found</h1>
        <p className="text-sm text-white/50 mb-8">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#030407] transition-all hover:opacity-95"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #b2ebf2 25%, #00E5FF 55%, #2E5BFF 100%)",
            boxShadow: "0 0 24px rgba(0, 229, 255, 0.25)",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { SparklesCore } from "@/components/ui/sparkles"
import { Wallet } from "lucide-react"
import { motion } from "framer-motion"

const LETTERS = ["N", "e", "c", "t", "o"]

export default function LandingPage() {
  const router = useRouter()
  const { isConnected, isConnecting, connect } = useWallet()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    if (isConnected) router.push("/dashboard")
  }, [isConnected, router])

  const handleConnect = async () => {
    try { await connect() } catch { /* user rejected */ }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black flex flex-col items-center justify-center">

      {/* ── Connect Wallet — top right ── */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={handleConnect}
          disabled={!mounted || isConnecting}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>

      {/* ── Centered content ── */}
      <div className="relative z-20 flex flex-col items-center">
        <motion.h1
          className="text-7xl md:text-8xl lg:text-9xl font-bold text-center text-white select-none tracking-tight flex"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {LETTERS.map((letter, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h1>

        {/* Sparkles strip */}
        <div className="w-[52rem] h-52 relative -mt-2">
          {/* gradient lines */}
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />

          {/* fade edges */}
          <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(420px_210px_at_top,transparent_20%,white)]" />
        </div>
      </div>
    </div>
  )
}

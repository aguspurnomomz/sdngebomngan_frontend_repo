import React from 'react'
import { useMotionValue } from 'framer-motion'
import teachpartnerIcon from '../../../assets/logo-new-version.png'

export default function LoginBanner() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(event.clientX - centerX)
    y.set(event.clientY - centerY)
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative flex flex-col justify-between gap-6 overflow-hidden bg-gradient-to-br from-tp-green via-[#1a6b4a] to-[#0d3d2c] p-6 text-white md:min-h-[520px] md:gap-0 md:p-10 cursor-default"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(125,211,167,0.35),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(255,255,255,0.08),transparent_35%)]" />

      <div className="relative z-10 flex items-center gap-2.5 text-lg font-bold">
        <img
          src={teachpartnerIcon}
          alt="SkoolaGo"
          className="h-7 w-auto object-contain md:h-8"
        />
      </div>

      <div className="relative z-10 py-2 md:py-4 transition-transform ease-out">
        <h2 className="mb-2 text-xl font-bold leading-snug tracking-tight sm:text-[22px] md:text-[26px]">
          Kelola dan buat administrasi mengajar menjadi lebih mudah
        </h2>
        <p className="max-w-xs text-xs leading-relaxed text-white/80 sm:text-sm">
          Satu platform terintegrasi untuk kehadiran, bank soal, e-book dan kelola ujian siswa.
        </p>
      </div>

      <div className="relative z-10 text-[11px] text-white/55 sm:text-xs">
        Copyright © 2025 - 2026{' '}
        <a
          href="https://skoolago.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/70 hover:text-white transition-colors duration-200 underline-offset-2 hover:underline"
        >
          SkoolaGo. All Rights Reserved.
        </a>
      </div>
    </div>
  )
}
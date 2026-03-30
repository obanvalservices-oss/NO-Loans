"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function LoginHero() {
  return (
    <div className="relative flex min-h-[42vh] flex-1 flex-col justify-center overflow-hidden bg-[#050a08] px-8 py-10 lg:min-h-screen lg:max-w-[52%]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(82,183,136,0.35),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(45,90,72,0.45),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(30,60,48,0.5),transparent_50%)]"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-1/4 h-[min(520px,60vw)] w-[min(520px,60vw)] rounded-full bg-brand-500/15 blur-[100px]"
        animate={{ rotate: 360, scale: [1, 1.08, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 right-0 h-[min(420px,50vw)] w-[min(420px,50vw)] rounded-full bg-emerald-600/10 blur-[90px]"
        animate={{ rotate: -360 }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125,226,209,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(125,226,209,0.35) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-10"
        >
          <motion.span
            className="absolute inset-0 -m-6 rounded-[2rem] bg-brand-400/20 blur-2xl"
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative overflow-hidden rounded-[2rem] ring-2 ring-brand-400/40 ring-offset-4 ring-offset-[#050a08] shadow-[0_0_80px_rgba(82,183,136,0.35)]">
            <Image
              src="/icon.png"
              alt=""
              width={200}
              height={200}
              className="h-40 w-40 object-cover sm:h-48 sm:w-48"
              priority
            />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          NO Loan
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.6 }}
          className="mt-3 max-w-md text-sm leading-relaxed text-brand-100/90 sm:text-base"
        >
          Precision loan schedules, payroll-ready reporting, and contracts — built
          for teams who care about clarity and control.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-300/90"
        >
          <span className="rounded-full border border-brand-500/35 bg-brand-950/60 px-3 py-1.5">
            Schedules
          </span>
          <span className="rounded-full border border-brand-500/35 bg-brand-950/60 px-3 py-1.5">
            Reporting
          </span>
          <span className="rounded-full border border-brand-500/35 bg-brand-950/60 px-3 py-1.5">
            Contracts
          </span>
        </motion.div>
      </div>
    </div>
  );
}

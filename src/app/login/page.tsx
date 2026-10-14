import { Geist } from "next/font/google";
import { Box, Lock } from "lucide-react";

import { LoginForm } from "@/components/LoginForm";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "AL3D — Entrar",
};

export default function LoginPage() {
  return (
    <main
      className={`${geist.className} relative flex min-h-screen flex-col overflow-hidden bg-[var(--bg-primary)] px-[20px] pt-[72px] pb-[32px] text-[var(--text-main)] sm:items-center sm:justify-center sm:p-0`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-[60px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[var(--emerald-bg)] blur-[100px] animate-glow-pulse motion-reduce:animate-none sm:top-[80px] sm:h-[640px] sm:w-[640px] sm:blur-[120px]"
      />

      <div className="relative z-10 flex w-full flex-1 flex-col gap-[28px] sm:w-[400px] sm:flex-none">
        <div className="flex flex-col items-center gap-[10px] sm:gap-[12px]">
          <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[13px] border border-[var(--border-focus)] bg-[var(--emerald-bg)] sm:h-[52px] sm:w-[52px] sm:rounded-[14px]">
            <Box
              aria-hidden
              strokeWidth={1.8}
              className="size-[24px] text-[var(--emerald-main)] sm:size-[26px]"
            />
          </div>
          <p className="m-0 text-[26px] font-bold tracking-[0.04em] text-[var(--text-main)] sm:text-[28px]">
            AL3D
          </p>
          <p className="m-0 text-[14px] text-[var(--text-muted)]">
            Fluxo de caixa e produção
          </p>
        </div>

        <LoginForm />

        <div className="mt-auto flex items-center justify-center gap-[8px] text-[12px] text-[var(--text-dim)] sm:mt-0">
          <Lock aria-hidden className="size-[14px]" />
          <span>Acesso restrito à operação AL3D</span>
        </div>
      </div>
    </main>
  );
}

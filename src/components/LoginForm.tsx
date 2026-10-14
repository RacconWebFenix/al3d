"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Preencha usuário e senha.");
      return;
    }

    setLoading(true);
    setError(null);

    let succeeded = false;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        succeeded = true;
        router.replace("/");
        router.refresh();
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (response.status === 429 || response.status === 500) {
        setError(payload?.error || "Usuário ou senha incorretos.");
        return;
      }

      if (response.status === 400 || response.status === 401) {
        setError("Usuário ou senha incorretos.");
        return;
      }

      setError("Não foi possível conectar. Tente novamente.");
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      if (!succeeded) {
        setLoading(false);
      }
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-[18px] rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card-solid)] px-[20px] py-[24px] sm:gap-[20px] sm:p-[32px] sm:shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-[4px]">
        <h1 className="m-0 text-[20px] font-semibold text-[var(--text-main)]">
          Entrar
        </h1>
        <p className="m-0 text-[14px] text-[var(--text-muted)]">
          Acesse com suas credenciais.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-[10px] rounded-[10px] border border-[var(--coral-glow)] bg-[var(--coral-bg)] px-[14px] py-[12px] text-[14px] text-[var(--coral-main)]"
        >
          <AlertCircle aria-hidden className="size-[18px] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-[8px]">
        <label
          htmlFor="usuario"
          className="text-[13px] font-medium text-[var(--text-muted)]"
        >
          Usuário
        </label>
        <input
          id="usuario"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          className="h-[50px] w-full rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-[14px] text-[16px] text-[var(--text-main)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--emerald-glow)] sm:h-[46px] sm:text-[15px]"
        />
      </div>

      <div className="flex flex-col gap-[8px]">
        <label
          htmlFor="senha"
          className="text-[13px] font-medium text-[var(--text-muted)]"
        >
          Senha
        </label>
        <div className="relative">
          <input
            id="senha"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`h-[50px] w-full rounded-[10px] border bg-[var(--bg-input)] px-[14px] pr-[52px] text-[16px] text-[var(--text-main)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--emerald-glow)] sm:h-[46px] sm:pr-[48px] sm:text-[15px] ${error ? "border-[var(--border-error)]" : "border-[var(--border-subtle)]"}`}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-[3px] top-[3px] flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[8px] bg-transparent text-[var(--text-dim)] sm:right-[4px] sm:top-[4px] sm:h-[38px] sm:w-[38px]"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-[20px] sm:size-[18px]" />
            ) : (
              <Eye aria-hidden className="size-[20px] sm:size-[18px]" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-[4px] flex h-[52px] cursor-pointer items-center justify-center gap-[8px] rounded-[10px] bg-[var(--emerald-main)] text-[16px] font-semibold text-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[48px] sm:text-[15px] sm:shadow-[0_8px_24px_var(--emerald-glow)]"
      >
        {loading ? (
          <>
            <Loader2 aria-hidden className="size-[18px] animate-spin" />
            <span>Entrando…</span>
          </>
        ) : (
          <span>Entrar</span>
        )}
      </button>
    </form>
  );
}

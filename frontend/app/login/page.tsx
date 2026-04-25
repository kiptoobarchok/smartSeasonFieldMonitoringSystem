"use client";

import { AxiosError } from "axios";
import {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { getMe, login } from "@/lib/api";
import { roleStorage, tokenStorage } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const accessToken = tokenStorage.get();

    if (!accessToken) {
      setCheckingSession(false);
      return;
    }

    getMe()
      .then((me) => {
        roleStorage.set(me.role);
        if (me.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/agent/dashboard");
        }
      })
      .catch(() => {
        tokenStorage.clear();
        roleStorage.clear();
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, [router]);

  const validationError = useMemo(() => {
    if (!identifier.trim()) {
      return "Please enter your username or email.";
    }
    if (!password.trim()) {
      return "Please enter your password.";
    }
    return "";
  }, [identifier, password]);

  const applyDemoCredentials = (
    event: MouseEvent<HTMLButtonElement>,
    role: "admin" | "agent"
  ) => {
    event.preventDefault();
    if (role === "admin") {
      setIdentifier("coordinator_demo");
    } else {
      setIdentifier("agent_demo");
    }
    setPassword("DemoPass123!");
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const accessToken = await login(identifier.trim(), password);
      tokenStorage.set(accessToken);

      const me = await getMe();
      roleStorage.set(me.role);

      if (me.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/agent/dashboard");
      }
    } catch (requestError: unknown) {
      const apiError = requestError as AxiosError<{ detail?: string }>;
      const fallbackMessage = "Login failed. Check your credentials and try again.";
      setError(apiError.response?.data?.detail || fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="mx-auto mt-24 max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-600">Checking active session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to continue monitoring your field operations.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              applyDemoCredentials(event, "admin")
            }
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Use Admin Demo
          </button>
          <button
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              applyDemoCredentials(event, "agent")
            }
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Use Agent Demo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="identifier" className="text-sm font-medium text-slate-700">
              Username or email
            </label>
            <input
              id="identifier"
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. coordinator_demo or your@email.com"
              value={identifier}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setIdentifier(event.target.value)
              }
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="flex items-center rounded-md border border-slate-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-blue-100">
              <input
                id="password"
                className="w-full rounded-md border-0 px-3 py-2 outline-none"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="mr-2 rounded px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Tip: You can use the demo buttons above for a quick start.
        </p>
      </div>
    </div>
  );
}

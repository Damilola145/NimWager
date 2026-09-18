import axios from "axios"
import { API_URL } from "@/lib/config"

/**
 * When VITE_API_URL is provided the app talks to the real backend; otherwise it
 * falls back to the in-memory mock. Flip a single env var to go live.
 */
export const USE_MOCK = !import.meta.env.VITE_API_URL

export const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
})

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined
    return data?.message ?? data?.error ?? err.message
  }
  if (err instanceof Error) return err.message
  return "Something went wrong"
}

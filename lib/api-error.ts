import { NextResponse } from "next/server"

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "SERVICE_ERROR"
  | "RATE_LIMITED"

/**
 * Standard API error shape. Use in route handlers for consistent responses.
 */
export interface ApiErrorBody {
  error: string
  code?: ApiErrorCode
  details?: string
}

/**
 * Log server-side error without leaking sensitive data. Use for Prisma, Clerk, or third-party errors.
 * Exported for use in server components (e.g. dashboard layout) where we don't return JSON.
 */
export function logServerError(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  const name = err instanceof Error ? err.name : "Error"
  const isConnectionError =
    err instanceof Error &&
    (err.name === "PrismaClientInitializationError" ||
      message.includes("FATAL") ||
      message.includes("Tenant or user not found"))
  console.error(
    `[${context}]`,
    name,
    message,
    isConnectionError ? "(database connection issue)" : ""
  )
  if (err instanceof Error && err.stack && process.env.NODE_ENV === "development") {
    console.error(err.stack)
  }
}

function logError(context: string, err: unknown) {
  logServerError(context, err)
}

/**
 * Return a NextResponse with standard error JSON. Logs the error server-side but returns a safe message.
 * Use for catch blocks so Prisma/DB/Clerk details are not sent to the client.
 */
export function apiError(
  err: unknown,
  options: {
    status?: number
    code?: ApiErrorCode
    publicMessage?: string
    context?: string
  } = {}
): NextResponse {
  const { status = 500, code = "SERVICE_ERROR", publicMessage, context = "api" } = options
  logError(context, err)

  const isConnectionError =
    err instanceof Error &&
    (err.name === "PrismaClientInitializationError" ||
      err.message.includes("FATAL") ||
      err.message.includes("Tenant or user not found"))

  const body: ApiErrorBody = {
    error: publicMessage ?? (isConnectionError ? "Database is temporarily unavailable. Please try again later." : "Something went wrong. Please try again."),
    code: status === 500 ? code : undefined,
  }
  return NextResponse.json(body, { status })
}

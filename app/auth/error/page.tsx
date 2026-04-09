import { AlertCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Authentication Error</h1>
            <p className="text-muted-foreground leading-relaxed">
              {params?.error
                ? `Something went wrong: ${params.error}`
                : 'An unexpected error occurred during authentication.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
            >
              Back to sign in
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-border text-foreground font-semibold hover:bg-muted transition-colors"
            >
              Go to homepage
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">UniBot</span>
          </div>
        </div>
      </div>
    </div>
  )
}

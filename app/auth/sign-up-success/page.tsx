import { MessageSquare, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground">
            <Mail className="w-8 h-8 text-background" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
            <p className="text-muted-foreground leading-relaxed">
              {"We've sent a confirmation link to your email address. Click the link to verify your account and get started."}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
            >
              Back to sign in
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

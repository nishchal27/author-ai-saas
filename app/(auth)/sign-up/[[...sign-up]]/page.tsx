import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import { Target } from "lucide-react"
import { PRODUCT_NAME } from "@/lib/constants"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Target className="h-6 w-6 text-primary" />
        <span className="text-xl font-semibold">{PRODUCT_NAME}</span>
      </Link>
      <SignUp />
    </div>
  )
}

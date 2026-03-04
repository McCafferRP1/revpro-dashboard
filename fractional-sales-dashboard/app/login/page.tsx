import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getSession } from "@/lib/auth";
import { storeRequiresDatabase } from "@/lib/store";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  if (storeRequiresDatabase()) redirect("/dashboard");
  const session = await getSession();
  if (session) redirect("/dashboard");

  const { from } = await searchParams;
  const callbackUrl = from && from.startsWith("/dashboard") ? from : "/dashboard";

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/revpro-logo.svg`} alt="RevPro" className="h-10 w-auto" width={150} height={40} />
        </div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] text-center mb-2">Sign in</h1>
        <p className="text-sm text-[var(--muted)] text-center mb-6">
          Enter your email and password to access the platform.
        </p>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}

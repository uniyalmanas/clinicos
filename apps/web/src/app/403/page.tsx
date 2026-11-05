import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-600 dark:bg-red-950/50 dark:text-red-400">
          403
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
          You do not have access to this area
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your account is signed in, but your role is not permitted to open this
          page. If you believe this is a mistake, ask your clinic owner or the
          platform administrator to review your access.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Sign in with another account
          </Link>
        </div>
      </div>
    </div>
  );
}

import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-zinc-50">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        The page you are looking for does not exist or was moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to dashboard</ButtonLink>
        <Link
          href="/loans"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-brand-400"
        >
          View loans
        </Link>
      </div>
    </div>
  );
}

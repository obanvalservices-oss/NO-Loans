import { LoginHero } from "./login-hero";
import { LoginPanel } from "./login-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ from?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const from =
    typeof sp.from === "string" &&
    sp.from.startsWith("/") &&
    !sp.from.startsWith("//")
      ? sp.from
      : "/";

  return (
    <div className="relative flex min-h-screen flex-col bg-[#050a08] lg:flex-row">
      <LoginHero />
      <div className="flex flex-1 items-center justify-center border-t border-white/5 bg-app bg-dot px-6 py-14 lg:border-l lg:border-t-0 lg:py-10">
        <LoginPanel redirectTo={from} />
      </div>
    </div>
  );
}

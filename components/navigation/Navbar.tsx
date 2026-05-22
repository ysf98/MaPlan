import Link from "next/link";
import { APP_NAME, ROUTES } from "@/utils/constants";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link className="text-lg font-bold tracking-tight text-[#c6283a]" href={ROUTES.home}>
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <Link className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-rose-50 hover:text-[#c6283a]" href={ROUTES.login}>
            Login
          </Link>
          <Link
            className="rounded-xl bg-[#c6283a] px-3 py-2 text-sm font-medium text-white hover:bg-[#a91f31]"
            href={ROUTES.register}
          >
            Registro
          </Link>
        </nav>
      </div>
    </header>
  );
}

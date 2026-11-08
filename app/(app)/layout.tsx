import Link from "next/link";
import { getContext } from "@/lib/context";

const links = [
  ["/", "Dashboard"], ["/transactions", "Transactions"], ["/import", "Import"], ["/receipts", "Receipts"],
  ["/income", "Income & tax"], ["/tips", "Tips"], ["/goals", "Goals"],
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getContext();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-semibold">My Finance</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {links.map(([href, label]) => <Link key={href} href={href} className="hover:underline">{label}</Link>)}
          </nav>
          <form action="/auth/signout" method="post" className="ml-auto text-xs muted flex gap-2 items-center">
            {user.email}
            <button className="underline">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

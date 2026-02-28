import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Admin-only V1. This is a manual operating system: suggestions are optional, edits are
            final.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            href="/dashboard/garments/new"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Add garment (intake)
          </Link>
          <Link
            href="/dashboard/garments"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            View garments (inventory)
          </Link>
          <Link
            href="/dashboard/calendar"
            className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            📅 Employee Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Staff backoffice.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-lg font-semibold">Garments</div>
          <div className="mt-1 text-sm text-muted-foreground">Add photos, edit details, manage inventory.</div>
          <div className="mt-4 grid gap-3">
            <Link
              href="/dashboard/garments/new"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              Add Garment
            </Link>
            <Link
              href="/dashboard/garments"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              View Garments
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-lg font-semibold">Employee Schedule</div>
          <div className="mt-1 text-sm text-muted-foreground">Calendar and timeslots.</div>
          <div className="mt-4">
            <Link
              href="/schedule"
              className="inline-flex rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Open Schedule
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-lg font-semibold">Employee Roles</div>
          <div className="mt-1 text-sm text-muted-foreground">Manage staff roles and permissions.</div>
          <div className="mt-4">
            <Link
              href="/dashboard/roles"
              className="inline-flex rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              Open Roles
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-lg font-semibold">Admin</div>
          <div className="mt-1 text-sm text-muted-foreground">Admin tools and reporting.</div>
          <div className="mt-4">
            <Link
              href="/dashboard/admin"
              className="inline-flex rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              Open Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

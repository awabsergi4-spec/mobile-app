import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";

// Operational oversight hub — the actual mutation surfaces (accept/decline,
// award, fund, complete, ...) already exist as the real customer/provider
// flows and the admin Finance/Disputes module; this is read visibility
// across the three service types, not a duplicate business-logic layer.
export default async function AdminServicesPage() {
  try {
    await requireAdminPermission("services.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="services.manage" />;
    }
    throw err;
  }

  const links = [
    { href: "/admin/services/on-demand", label: "On-Demand requests" },
    { href: "/admin/services/contracts", label: "Contract projects" },
    { href: "/admin/services/remote", label: "Remote engagements" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">Services</h1>
      <p className="mt-1 text-sm text-text-secondary">Operational oversight across all three service types.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-card border border-text-disabled/20 bg-surface-light p-6 text-sm font-medium text-text-primary hover:border-primary hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

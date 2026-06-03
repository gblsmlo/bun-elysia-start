import { and, eq } from "drizzle-orm";
import { auth } from "@infra/auth";
import { db } from "@infra/db";
import { member } from "@infra/db/schema";
import type { OrganizationRole } from "@models/member";

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type OrganizationContext = {
  session: AuthSession["session"];
  user: AuthSession["user"];
  organizationId: string;
  memberId: string;
  role: OrganizationRole;
};

type OrganizationContextOptions = {
  organizationId?: string;
  allowedRoles?: OrganizationRole[];
};

type OrganizationContextResult =
  | { ok: true; context: OrganizationContext }
  | { ok: false; response: Response };

const jsonError = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status });

export async function resolveOrganizationContext(
  request: Request,
  options: OrganizationContextOptions = {},
): Promise<OrganizationContextResult> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return {
      ok: false,
      response: jsonError(401, "UNAUTHENTICATED", "Authentication required"),
    };
  }

  const organizationId =
    options.organizationId ?? session.session.activeOrganizationId;

  if (!organizationId) {
    return {
      ok: false,
      response: jsonError(
        400,
        "NO_ACTIVE_ORGANIZATION",
        "Select an active organization before accessing this resource",
      ),
    };
  }

  const [membership] = await db
    .select({
      id: member.id,
      role: member.role,
    })
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!membership) {
    return {
      ok: false,
      response: jsonError(
        403,
        "ORGANIZATION_MEMBERSHIP_REQUIRED",
        "User is not a member of this organization",
      ),
    };
  }

  if (!isOrganizationRole(membership.role)) {
    return {
      ok: false,
      response: jsonError(
        403,
        "UNSUPPORTED_ORGANIZATION_ROLE",
        "User role is not enabled for this application",
      ),
    };
  }

  if (
    options.allowedRoles &&
    !options.allowedRoles.includes(membership.role)
  ) {
    return {
      ok: false,
      response: jsonError(
        403,
        "INSUFFICIENT_ORGANIZATION_ROLE",
        "User role cannot access this resource",
      ),
    };
  }

  return {
    ok: true,
    context: {
      session: session.session,
      user: session.user,
      organizationId,
      memberId: membership.id,
      role: membership.role,
    },
  };
}

function isOrganizationRole(role: string): role is OrganizationRole {
  return role === "owner" || role === "member";
}

import type { Permission, PermissionAction } from "@ecmp/shared-types";
import { ForbiddenException } from "@nestjs/common";

/**
 * Content type schema administration is administrator-only. Callers forward the
 * caller's granted permissions through the `x-ecmp-permissions` header (as the
 * CMIS controller already does). Administration operations require the
 * `content-type:<action>` permission that the Admin role carries.
 *
 * When no permission context is supplied (empty header), enforcement is skipped
 * so existing no-auth development flows keep working, mirroring the CMIS adapter.
 */
export const SCHEMA_ADMIN_RESOURCE = "content-type";

export function parseEcmpPermissions(header?: string): Permission[] {
  if (!header) {
    return [];
  }

  return header
    .split(",")
    .map((permission) => permission.trim())
    .filter((permission): permission is Permission => permission.includes(":"));
}

export function requireSchemaAdmin(permissions: Permission[], action: PermissionAction): void {
  if (permissions.length === 0) {
    return;
  }

  const allowed = permissions.some((permission) => {
    const [resource, ownedAction] = permission.split(":");

    return (
      (resource === SCHEMA_ADMIN_RESOURCE || resource === "*") &&
      (ownedAction === action || ownedAction === "*")
    );
  });

  if (!allowed) {
    throw new ForbiddenException(
      `Administrator permission '${SCHEMA_ADMIN_RESOURCE}:${action}' is required for schema administration.`
    );
  }
}

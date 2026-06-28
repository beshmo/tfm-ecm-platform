import type { Permission, Role, UserId } from "@ecmp/shared-types";

export interface AuthClaims {
  sub: UserId;
  email: string;
  roles: Role[];
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

export function hasPermission(claims: AuthClaims, required: Permission): boolean {
  const [resource, action] = required.split(":");

  return claims.permissions.some((permission) => {
    const [ownedResource, ownedAction] = permission.split(":");

    return (
      (ownedResource === resource || ownedResource === "*") &&
      (ownedAction === action || ownedAction === "*")
    );
  });
}

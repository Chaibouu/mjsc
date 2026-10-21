"use client";

import { UserRole } from "@prisma/client";
import { FormError } from "@/components/form-error";
import { useSession } from "@/context/SessionContext";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole | readonly UserRole[];
};

export const RoleGate = ({
  children,
  allowedRole,
}: RoleGateProps) => {
  const {user} = useSession()

  const allowed: readonly string[] = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  if (!user?.role || !allowed.includes(user.role)) {
    return (
      <FormError message="You do not have permission to view this content!" />
    )
  }

  return (
    <>
      {children}
    </>
  );
};

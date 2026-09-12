import { User } from "@repo/types";
import { ForbiddenError } from "./errors";

/**
 * Validates that the authenticated user owns the resource or has administrative privileges.
 * @param currentUser The authenticated user from req.user
 * @param resourceOwnerId The customer ID associated with the database record
 * @param allowAdmin Whether administrators can bypass ownership check (defaults to true)
 * @throws ForbiddenError if the user is neither the owner nor an authorized admin
 */
export const assertOwnership = (
  currentUser: User,
  resourceOwnerId: string,
  allowAdmin = true
): void => {
  if (allowAdmin && currentUser.role === "ADMIN") {
    return;
  }

  if (currentUser.id !== resourceOwnerId) {
    throw new ForbiddenError("Access denied. You do not have permission to access or modify this resource.");
  }
};

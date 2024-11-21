import { Identifier } from "ra-core";
import { GetConfig } from "./config";

/**
 * Check if a user is managed by an application service
 * @param id The user ID to check
 * @returns Whether the user is managed by an application service
 */
export const isASManaged = (id: string | Identifier): boolean => {
  return GetConfig().asManagedUsers.some(regex => regex.test(id as string));
};

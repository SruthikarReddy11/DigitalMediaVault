import { AuthUser } from '../types';

export function isOwnerOrAdmin(resourceUserId: string, user: AuthUser): boolean {
  if (user.role === 'ADMIN') return true;
  return resourceUserId === user.id;
}

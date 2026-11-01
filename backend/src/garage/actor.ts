import {
  GUP_SCOPE_ID,
  isTransportUnitRole,
  type StaffRole,
  type StaffUser,
} from './garage.types.js';

export type WorkspaceKind = 'dispatcher' | 'branch_chief' | 'applicant';

export type Actor = {
  id: string;
  name: string;
  initials: string;
  role: StaffRole;
  branchId: string;
};

export function actorFromStaff(user: StaffUser): Actor {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    role: user.role,
    branchId: user.branchId,
  };
}

export function workspaceForRole(role: StaffRole): WorkspaceKind {
  if (role === 'branch_chief') return 'branch_chief';
  if (role === 'dispatcher' || isTransportUnitRole(role)) return 'dispatcher';
  return 'applicant';
}

/** null — видит все филиалы. Иначе только свой. */
export function branchScope(actor: Actor) {
  return isTransportUnitRole(actor.role) ? null : actor.branchId;
}

export function publicProfile(actor: Actor) {
  return {
    staffId: actor.id,
    name: actor.name,
    initials: actor.initials,
    role: actor.role,
    branchId: actor.branchId === GUP_SCOPE_ID ? null : actor.branchId,
    workspace: workspaceForRole(actor.role),
  };
}

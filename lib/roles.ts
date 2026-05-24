export type UserRole = 'PATIENT' | 'DOCTOR';

export function getDashboardPath(role: UserRole): string {
  return role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard';
}

export function getProfilePath(role: UserRole): string {
  return role === 'DOCTOR' ? '/doctor/profile' : '/patient/profile';
}

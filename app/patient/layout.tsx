import { RoleGate } from '@/components/auth/RoleGate';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGate allowedRole="PATIENT">{children}</RoleGate>;
}

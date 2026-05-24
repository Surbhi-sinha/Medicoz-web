import { RoleGate } from '@/components/auth/RoleGate';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGate allowedRole="DOCTOR">{children}</RoleGate>;
}

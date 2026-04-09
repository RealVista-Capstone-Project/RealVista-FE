import { ManageAgentProposalsScreen } from '@/screens/manage-agent-proposals/ui/manage-agent-proposals-screen';
import { RoleGuard } from '@/shared/lib/auth/role-guard';

export default function ManageProposalsPage() {
  return (
    <RoleGuard
      allowedRoles={[]}
      allowedBackendRoles={['AGENT']}
      redirectPath='/dashboard'
    >
      <ManageAgentProposalsScreen />
    </RoleGuard>
  );
}

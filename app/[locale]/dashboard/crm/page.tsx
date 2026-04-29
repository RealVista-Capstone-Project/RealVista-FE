import { CrmPage } from '@/features/crm';
import { AuthGuard } from '@/shared/lib/auth/auth-guard';

export default function DashboardCrmPage() {
  return (
    <AuthGuard>
      <CrmPage />
    </AuthGuard>
  );
}

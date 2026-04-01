import MyEngagementsPage from '@/screens/dashboard/my-engagements/my-engagements-page';
import { AuthGuard } from '@/shared/lib/auth/auth-guard';

export default function DashboardMyEngagementsPage() {
  return (
    <AuthGuard>
      <MyEngagementsPage />
    </AuthGuard>
  );
}

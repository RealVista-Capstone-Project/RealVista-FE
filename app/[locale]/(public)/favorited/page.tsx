import { FavoritedPage } from '@/screens/favorited';
import { AuthGuard } from '@/shared/lib/auth/auth-guard';

export default function FavoritedPageRoute() {
  return (
    <AuthGuard>
      <FavoritedPage />
    </AuthGuard>
  );
}

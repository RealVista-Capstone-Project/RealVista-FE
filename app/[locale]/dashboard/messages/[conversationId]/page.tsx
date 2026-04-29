import { MessagesPage } from '@/screens/dashboard/messages/messages-page';

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { conversationId } = await params;

  return <MessagesPage conversationId={conversationId} />;
}

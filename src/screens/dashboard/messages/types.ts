export interface TimelineEvent {
  id: string;
  icon: 'check' | 'plus';
  title: string;
  date?: string;
  amount?: string;
  badge?: string;
  sub?: string;
  link?: { label: string; href: string };
}

export interface ConversationDetail {
  name: string;
  initials: string;
  avatarBg: string;
  company: string;
  timezone: string;
  isOnline: boolean;
  timeline: TimelineEvent[];
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  avatarBg?: string;
}

export interface Message {
  id: string;
  sender: Participant;
  text: string;
  time: string;
  reactions?: { emoji: string; count: number }[];
  isLink?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  avatarBg?: string;
  lastMessage: string;
  time: string;
  unread?: number;
  isTyping?: boolean;
  isPinned?: boolean;
  participants?: Participant[];
}

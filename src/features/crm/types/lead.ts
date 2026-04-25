export enum LeadStatus {
  NEW = 'NEW',
  CONSULTING = 'CONSULTING',
  TOUR_SCHEDULED = 'TOUR_SCHEDULED',
  TOURED = 'TOURED',
  NEGOTIATING = 'NEGOTIATING',
  CLOSED = 'CLOSED',
  NOT_POTENTIAL = 'NOT_POTENTIAL',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Mới tiếp cận',
  [LeadStatus.CONSULTING]: 'Đang tư vấn',
  [LeadStatus.TOUR_SCHEDULED]: 'Đã đặt lịch xem',
  [LeadStatus.TOURED]: 'Đã xem nhà',
  [LeadStatus.NEGOTIATING]: 'Đang đàm phán',
  [LeadStatus.CLOSED]: 'Đã chốt deal',
  [LeadStatus.NOT_POTENTIAL]: 'Không tiềm năng',
};

export const LEAD_STATUS_COLORS: Record<
  LeadStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  [LeadStatus.NEW]: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    dot: 'bg-primary',
  },
  [LeadStatus.CONSULTING]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [LeadStatus.TOUR_SCHEDULED]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  [LeadStatus.TOURED]: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  [LeadStatus.NEGOTIATING]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  [LeadStatus.CLOSED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  [LeadStatus.NOT_POTENTIAL]: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground',
  },
};

export interface LeadNote {
  id: string;
  content: string;
  createdAt: string;
  /** status snapshot at time of note */
  status: LeadStatus;
}

export interface Lead {
  id: string;
  customerName: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  /** property or listing the customer is interested in */
  propertyInterest?: string;
  status: LeadStatus;
  /** last note content (shortcut display) */
  lastNote?: string;
  notes: LeadNote[];
  /** ISO date string */
  createdAt: string;
  updatedAt: string;
  /** source: chat, tour, call, manual */
  source: 'chat' | 'tour' | 'call' | 'manual';
}

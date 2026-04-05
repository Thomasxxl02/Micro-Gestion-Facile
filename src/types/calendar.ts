export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  type: 'meeting' | 'task' | 'deadline' | 'other';
  clientId?: string;
  invoiceId?: string;
  color?: string;
}


export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // Attendee name
  participants: string[]; // Attendee names
}

export interface Settlement {
  from: string; // Attendee name
  to: string; // Attendee name
  amount: number;
}

export interface Balance {
  attendeeName: string;
  amount: number; // Positive: is owed, Negative: owes
}

export interface AttendeeGroup {
  id: string;
  name: string;
  members: string[]; // Attendee names
  isSystemGroup?: boolean; // Flag for special system-managed groups like "All Attendees"
}

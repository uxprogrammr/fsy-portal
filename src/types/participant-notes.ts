export type NoteType = 'Positive' | 'Negative';
export type NoteCategory = 
  | 'Group Participation'
  | 'Leadership Initiative'
  | 'Spiritual Insight'
  | 'Kindness/Service'
  | 'Attendance & Functionality'
  | 'Technology Misuse'
  | 'Group Behavior & Participation'
  | 'Curfew & Dorm Violations'
  | 'Cleanliness & Personal Responsibility';
export type NoteSeverity = 'Low' | 'Medium' | 'High';

export interface ParticipantNote {
  note_id: number;
  participant_fsy_id: number;
  counselor_fsy_id: number;
  note_type: NoteType;
  category: NoteCategory;
  message: string;
  severity: NoteSeverity;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  participant_fsy_id: number;
  note_type: NoteType;
  category: NoteCategory;
  message: string;
  severity: NoteSeverity;
  photo_url?: string;
} 
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type FormField = { key: string; label: string; type: 'text' | 'textarea' | 'select'; required: boolean; options?: string[] };
export type ScheduleDay = { id: string; weekday: number; title: string; title_ar: string; description: string; emoji: string; color: string; is_enabled: boolean };
export type ClinicMember = { id: string; name: string; role: string; bio: string; photo_url: string | null; sort_order: number; is_active: boolean };
export type Topic = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  kind: 'weekly' | 'special';
  weekday: number | null;
  image_url: string | null;
  badge: string | null;
  accent_color: string | null;
  sort_order: number;
  form_fields: FormField[];
};
export type Application = {
  id: string;
  topic_id: string;
  full_name: string;
  age: number;
  city: string;
  whatsapp: string;
  message: string;
  instagram: string | null;
  status: ApplicationStatus;
  created_at: string;
  extra: Record<string, string>;
};
export type ActionResult = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> };
export type Counts = { total: number; pending: number; accepted: number; rejected: number };
type Table<Row, Insert, Update = Partial<Insert>, Relationships extends { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }[] = []> = { Row: Row; Insert: Insert; Update: Update; Relationships: Relationships };
export type Database = {
  public: {
    Tables: {
      topics: Table<Topic, Omit<Topic, 'id' | 'created_at'> & { id?: string; created_at?: string }>;
      applications: Table<Application, Omit<Application, 'id' | 'created_at' | 'status'> & { id?: string; created_at?: string; status?: ApplicationStatus }, Partial<Omit<Application, 'id'>>, [{ foreignKeyName: 'applications_topic_id_fkey'; columns: ['topic_id']; isOneToOne: false; referencedRelation: 'topics'; referencedColumns: ['id'] }] >;
      admins: Table<{ user_id: string }, { user_id: string }>;
      settings: Table<{ key: string; value: string }, { key: string; value: string }>;
      schedule_days: Table<ScheduleDay, Omit<ScheduleDay, 'id'> & { id?: string }>;
      clinic_team: Table<ClinicMember, Omit<ClinicMember, 'id'> & { id?: string }>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      first_admin_available: { Args: Record<string, never>; Returns: boolean };
      claim_first_admin: { Args: Record<string, never>; Returns: boolean };
      admin_application_counts: { Args: Record<string, never>; Returns: { topic_id: string | null; total: number; pending: number; accepted: number; rejected: number }[] };
      reorder_topic: { Args: { p_topic_id: string; p_direction: number }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

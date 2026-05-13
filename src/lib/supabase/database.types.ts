export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReminderStatus = "pending" | "sent" | "cancelled" | "failed";
export type AppRole = "employee" | "dev";
export type FeedItemKind = "notification" | "reminder";
export type FeedItemStatus = "pending" | "sent" | "failed" | "cancelled";
export type FeedPriority = "low" | "normal" | "high";
export type FeedTargetMode = "all" | "teams" | "users";
export type MessageChannel = "email" | "sms" | "whatsapp";
export type DeliveryStatus = "queued" | "sent" | "failed" | "skipped";

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          message: string;
          scheduled_at: string;
          status: ReminderStatus;
          attempts: number;
          last_error: string | null;
          last_attempt_at: string | null;
          claimed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          message: string;
          scheduled_at: string;
          status?: ReminderStatus;
          attempts?: number;
          last_error?: string | null;
          last_attempt_at?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          role: AppRole;
          display_name: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AppRole;
          display_name?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          owner_id: string | null;
          slug: string;
          name: string;
          color: string;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          slug: string;
          name: string;
          color?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          owner_id: string | null;
          category_id: string | null;
          slug: string;
          name: string;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          category_id?: string | null;
          slug: string;
          name: string;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      feed_items: {
        Row: {
          id: string;
          kind: FeedItemKind;
          status: FeedItemStatus;
          title: string;
          body: string | null;
          category_id: string | null;
          session_id: string | null;
          priority: FeedPriority;
          due_date: string | null;
          published_at: string;
          expires_at: string | null;
          target_mode: FeedTargetMode;
          is_draft: boolean;
          is_pinned: boolean;
          image_url: string | null;
          send_channels: string[];
          action_label: string | null;
          action_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind: FeedItemKind;
          status?: FeedItemStatus;
          title: string;
          body?: string | null;
          category_id?: string | null;
          session_id?: string | null;
          priority?: FeedPriority;
          due_date?: string | null;
          published_at?: string;
          expires_at?: string | null;
          target_mode?: FeedTargetMode;
          is_draft?: boolean;
          is_pinned?: boolean;
          image_url?: string | null;
          send_channels?: string[];
          action_label?: string | null;
          action_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feed_items"]["Insert"]>;
      };
      feed_item_reads: {
        Row: { feed_item_id: string; user_id: string; read_at: string };
        Insert: { feed_item_id: string; user_id: string; read_at?: string };
        Update: Partial<Database["public"]["Tables"]["feed_item_reads"]["Insert"]>;
      };
      feed_item_reactions: {
        Row: {
          feed_item_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          feed_item_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feed_item_reactions"]["Insert"]>;
      };
      notification_templates: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          kind: FeedItemKind;
          title: string;
          body: string | null;
          priority: FeedPriority;
          category_id: string | null;
          action_label: string | null;
          action_url: string | null;
          send_channels: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          kind?: FeedItemKind;
          title: string;
          body?: string | null;
          priority?: FeedPriority;
          category_id?: string | null;
          action_label?: string | null;
          action_url?: string | null;
          send_channels?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_templates"]["Insert"]>;
      };
      category_mutes: {
        Row: { user_id: string; category_id: string; created_at: string };
        Insert: { user_id: string; category_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["category_mutes"]["Insert"]>;
      };
      feed_item_comments: {
        Row: {
          id: string;
          feed_item_id: string;
          user_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          feed_item_id: string;
          user_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feed_item_comments"]["Insert"]>;
      };
      teams: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          slug: string;
          name: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
          added_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          added_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
      };
      feed_item_target_teams: {
        Row: { feed_item_id: string; team_id: string };
        Insert: { feed_item_id: string; team_id: string };
        Update: Partial<Database["public"]["Tables"]["feed_item_target_teams"]["Insert"]>;
      };
      feed_item_target_users: {
        Row: { feed_item_id: string; user_id: string };
        Insert: { feed_item_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["feed_item_target_users"]["Insert"]>;
      };
      notification_schedules: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          body: string | null;
          kind: FeedItemKind;
          category_id: string | null;
          session_id: string | null;
          priority: FeedPriority;
          timezone: string;
          times: string[];
          days_of_week: number[];
          target_mode: FeedTargetMode;
          is_active: boolean;
          last_run_at: string | null;
          next_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          body?: string | null;
          kind?: FeedItemKind;
          category_id?: string | null;
          session_id?: string | null;
          priority?: FeedPriority;
          timezone?: string;
          times: string[];
          days_of_week: number[];
          target_mode?: FeedTargetMode;
          is_active?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_schedules"]["Insert"]>;
      };
      schedule_target_teams: {
        Row: { schedule_id: string; team_id: string };
        Insert: { schedule_id: string; team_id: string };
        Update: Partial<Database["public"]["Tables"]["schedule_target_teams"]["Insert"]>;
      };
      schedule_target_users: {
        Row: { schedule_id: string; user_id: string };
        Insert: { schedule_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["schedule_target_users"]["Insert"]>;
      };
      schedule_runs: {
        Row: {
          schedule_id: string;
          run_at: string;
          feed_item_id: string | null;
          created_at: string;
        };
        Insert: {
          schedule_id: string;
          run_at: string;
          feed_item_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["schedule_runs"]["Insert"]>;
      };
      app_settings: {
        Row: {
          id: number;
          app_name: string;
          app_tagline: string | null;
          logo_url: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          app_name?: string;
          app_tagline?: string | null;
          logo_url?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
      };
      notification_deliveries: {
        Row: {
          id: string;
          channel: MessageChannel;
          recipient: string;
          subject: string | null;
          body: string;
          status: DeliveryStatus;
          provider: string | null;
          provider_message_id: string | null;
          error: string | null;
          metadata: Json;
          user_id: string | null;
          source: string | null;
          source_id: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          channel: MessageChannel;
          recipient: string;
          subject?: string | null;
          body: string;
          status: DeliveryStatus;
          provider?: string | null;
          provider_message_id?: string | null;
          error?: string | null;
          metadata?: Json;
          user_id?: string | null;
          source?: string | null;
          source_id?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_deliveries"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_dev: { Args: Record<string, never>; Returns: boolean };
      compute_next_run: {
        Args: {
          p_timezone: string;
          p_times: string[];
          p_days_of_week: number[];
          p_after?: string;
        };
        Returns: string | null;
      };
    };
    Enums: {
      reminder_status: ReminderStatus;
      app_role: AppRole;
      feed_item_kind: FeedItemKind;
      feed_item_status: FeedItemStatus;
      feed_priority: FeedPriority;
      feed_target_mode: FeedTargetMode;
      message_channel: MessageChannel;
      delivery_status: DeliveryStatus;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminRole = 'admin' | 'editor';
export type RegistrationStatus = 'open' | 'closed' | 'announced' | 'past';
export type ActivityStatus = 'new' | 'contacted' | 'resolved';
export type EnquiryType = 'contact' | 'volunteer' | 'book_donation' | 'collaboration';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: AdminRole | null;
          designation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: AdminRole | null;
          designation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: AdminRole | null;
          designation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meetups: {
        Row: {
          id: string;
          title: string;
          slug: string;
          edition: string | null;
          starts_at: string;
          ends_at: string | null;
          time_label: string | null;
          venue: string;
          address: string | null;
          description: string;
          featured_image: string | null;
          registration_url: string | null;
          registration_status: RegistrationStatus;
          capacity: number | null;
          activities: Json;
          schedule: Json;
          highlights: string | null;
          is_published: boolean;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          edition?: string | null;
          starts_at: string;
          ends_at?: string | null;
          time_label?: string | null;
          venue: string;
          address?: string | null;
          description?: string;
          featured_image?: string | null;
          registration_url?: string | null;
          registration_status?: RegistrationStatus;
          capacity?: number | null;
          activities?: Json;
          schedule?: Json;
          highlights?: string | null;
          is_published?: boolean;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          edition?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          time_label?: string | null;
          venue?: string;
          address?: string | null;
          description?: string;
          featured_image?: string | null;
          registration_url?: string | null;
          registration_status?: RegistrationStatus;
          capacity?: number | null;
          activities?: Json;
          schedule?: Json;
          highlights?: string | null;
          is_published?: boolean;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      registrations: {
        Row: {
          id: string;
          meetup_id: string;
          name: string;
          email: string;
          phone: string | null;
          message: string | null;
          consent: boolean;
          status: ActivityStatus;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          meetup_id: string;
          name: string;
          email: string;
          phone?: string | null;
          message?: string | null;
          consent: boolean;
          status?: ActivityStatus;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          meetup_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          message?: string | null;
          consent?: boolean;
          status?: ActivityStatus;
          details?: Json;
          created_at?: string;
        };
      };
      gallery_images: {
        Row: {
          id: string;
          title: string;
          caption: string | null;
          image_path: string;
          thumbnail_path: string | null;
          alt_text: string | null;
          meetup_id: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          caption?: string | null;
          image_path: string;
          thumbnail_path?: string | null;
          alt_text?: string | null;
          meetup_id?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          caption?: string | null;
          image_path?: string;
          thumbnail_path?: string | null;
          alt_text?: string | null;
          meetup_id?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reels: {
        Row: {
          id: string;
          title: string;
          caption: string | null;
          video_path: string;
          poster_path: string | null;
          external_video_url: string | null;
          duration_seconds: number | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          caption?: string | null;
          video_path: string;
          poster_path?: string | null;
          external_video_url?: string | null;
          duration_seconds?: number | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          caption?: string | null;
          video_path?: string;
          poster_path?: string | null;
          external_video_url?: string | null;
          duration_seconds?: number | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          action_url: string | null;
          is_published: boolean;
          published_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          action_url?: string | null;
          is_published?: boolean;
          published_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          action_url?: string | null;
          is_published?: boolean;
          published_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          author: string;
          author_role: string | null;
          category: string;
          language: string;
          reading_time: string | null;
          cover_image: string | null;
          excerpt: string;
          content: string;
          tags: Json;
          featured: boolean;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          author: string;
          author_role?: string | null;
          category: string;
          language: string;
          reading_time?: string | null;
          cover_image?: string | null;
          excerpt: string;
          content: string;
          tags?: Json;
          featured?: boolean;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          author?: string;
          author_role?: string | null;
          category?: string;
          language?: string;
          reading_time?: string | null;
          cover_image?: string | null;
          excerpt?: string;
          content?: string;
          tags?: Json;
          featured?: boolean;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      enquiries: {
        Row: {
          id: string;
          type: EnquiryType;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          details: Json;
          consent: boolean;
          status: ActivityStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: EnquiryType;
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          details?: Json;
          consent: boolean;
          status?: ActivityStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: EnquiryType;
          name?: string;
          email?: string;
          phone?: string | null;
          message?: string;
          details?: Json;
          consent?: boolean;
          status?: ActivityStatus;
          created_at?: string;
        };
      };
    };
  };
}

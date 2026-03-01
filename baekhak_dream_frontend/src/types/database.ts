/**
 * Supabase Database 타입 (자동 생성)
 * `npx supabase gen types typescript` 또는 MCP로 업데이트
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      dream_sentences: {
        Row: {
          id: string;
          source: string;
          title: string | null;
          writer: string | null;
          post: string;
          round_num: number | null;
          post_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          source: string;
          title?: string | null;
          writer?: string | null;
          post: string;
          round_num?: number | null;
          post_date?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          source?: string;
          title?: string | null;
          writer?: string | null;
          post?: string;
          round_num?: number | null;
          post_date?: string | null;
          created_at?: string | null;
        };
      };
      dream_keywords: {
        Row: {
          id: string;
          word: string;
          sense: string | null;
          nums: number[];
          star: number;
          end_digits: number[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          word: string;
          sense?: string | null;
          nums?: number[];
          star?: number;
          end_digits?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          word?: string;
          sense?: string | null;
          nums?: number[];
          star?: number;
          end_digits?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}

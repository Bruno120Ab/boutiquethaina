export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      carne_installments: {
        Row: {
          amount: number
          created_at: string
          creditor_id: number
          due_date: string
          id: number
          installment_number: number
          paid: boolean
          paid_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          creditor_id: number
          due_date: string
          id?: number
          installment_number: number
          paid?: boolean
          paid_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          creditor_id?: number
          due_date?: string
          id?: number
          installment_number?: number
          paid?: boolean
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carne_installments_creditor_id_fkey"
            columns: ["creditor_id"]
            isOneToOne: false
            referencedRelation: "creditors"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_sales: {
        Row: {
          created_at: string
          creditor_id: number
          due_date: string
          id: number
          installment_number: number
          installment_value: number
          paid_date: string | null
          sale_id: number
          status: string
        }
        Insert: {
          created_at?: string
          creditor_id: number
          due_date: string
          id?: number
          installment_number: number
          installment_value: number
          paid_date?: string | null
          sale_id: number
          status: string
        }
        Update: {
          created_at?: string
          creditor_id?: number
          due_date?: string
          id?: number
          installment_number?: number
          installment_value?: number
          paid_date?: string | null
          sale_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_sales_creditor_id_fkey"
            columns: ["creditor_id"]
            isOneToOne: false
            referencedRelation: "creditors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_sales_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      creditors: {
        Row: {
          created_at: string
          customer_id: number
          customer_name: string
          description: string
          due_date: string
          id: number
          paid_amount: number
          remaining_amount: number
          status: string
          total_debt: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: number
          customer_name: string
          description: string
          due_date: string
          id?: number
          paid_amount?: number
          remaining_amount: number
          status: string
          total_debt: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: number
          customer_name?: string
          description?: string
          due_date?: string
          id?: number
          paid_amount?: number
          remaining_amount?: number
          status?: string
          total_debt?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creditors_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: number
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: number
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: number
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      exchanges: {
        Row: {
          created_at: string
          customer_id: number | null
          id: number
          new_items: Json
          new_sale_id: number | null
          original_sale_id: number
          processed_at: string | null
          reason: string
          returned_items: Json
          status: string
          user_id: number
        }
        Insert: {
          created_at?: string
          customer_id?: number | null
          id?: number
          new_items: Json
          new_sale_id?: number | null
          original_sale_id: number
          processed_at?: string | null
          reason: string
          returned_items: Json
          status: string
          user_id: number
        }
        Update: {
          created_at?: string
          customer_id?: number | null
          id?: number
          new_items?: Json
          new_sale_id?: number | null
          original_sale_id?: number
          processed_at?: string | null
          reason?: string
          returned_items?: Json
          status?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "exchanges_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_new_sale_id_fkey"
            columns: ["new_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_original_sale_id_fkey"
            columns: ["original_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          due_date: string
          id: number
          paid: boolean
          supplier: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: number
          paid?: boolean
          supplier: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: number
          paid?: boolean
          supplier?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          creditor_id: number
          id: number
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          creditor_id: number
          id?: never
          notes?: string | null
          payment_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creditor_id?: number
          id?: never
          notes?: string | null
          payment_date?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string
          created_at: string
          description: string | null
          id: number
          min_stock: number
          name: string
          price: number
          stock: number
          supplier: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: number
          min_stock?: number
          name: string
          price: number
          stock?: number
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: number
          min_stock?: number
          name?: string
          price?: number
          stock?: number
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          created_at: string
          customer_id: number | null
          id: number
          items: Json
          processed_at: string | null
          reason: string
          sale_id: number
          status: string
          total_refund: number
          type: string
          user_id: number
        }
        Insert: {
          created_at?: string
          customer_id?: number | null
          id?: number
          items: Json
          processed_at?: string | null
          reason: string
          sale_id: number
          status: string
          total_refund: number
          type: string
          user_id: number
        }
        Update: {
          created_at?: string
          customer_id?: number | null
          id?: number
          items?: Json
          processed_at?: string | null
          reason?: string
          sale_id?: number
          status?: string
          total_refund?: number
          type?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: number | null
          discount: number
          id: number
          installment_value: number | null
          installments: number | null
          items: Json
          payment_method: string
          total: number
          user_id: number
        }
        Insert: {
          created_at?: string
          customer_id?: number | null
          discount?: number
          id?: number
          installment_value?: number | null
          installments?: number | null
          items: Json
          payment_method: string
          total: number
          user_id: number
        }
        Update: {
          created_at?: string
          customer_id?: number | null
          discount?: number
          id?: number
          installment_value?: number | null
          installments?: number | null
          items?: Json
          payment_method?: string
          total?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: number
          product_id: number
          product_name: string
          quantity: number
          reason: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          product_id: number
          product_name: string
          quantity: number
          reason: string
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          product_id?: number
          product_name?: string
          quantity?: number
          reason?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_users: {
        Row: {
          created_at: string
          id: number
          password: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: number
          password: string
          role: string
          username: string
        }
        Update: {
          created_at?: string
          id?: number
          password?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

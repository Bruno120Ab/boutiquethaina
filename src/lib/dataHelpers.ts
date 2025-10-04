// Helper functions to transform data between IndexedDB format and Supabase format

export const toSupabaseDate = (date: Date | string): string => {
  return new Date(date).toISOString();
};

export const fromSupabaseDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Convert price from display format (e.g., 10.50) to database format (1050)
export const toDatabasePrice = (price: number): number => {
  return Math.round(price * 100);
};

// Convert price from database format (1050) to display format (10.50)
export const fromDatabasePrice = (price: number): number => {
  return price / 100;
};

// Helper to safely get number from Supabase bigint
export const toNumber = (value: any): number => {
  return typeof value === 'string' ? parseInt(value, 10) : Number(value);
};

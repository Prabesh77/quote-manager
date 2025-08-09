// Database Schema Utilities
// This handles the mismatch between camelCase (app) and snake_case (database)

import supabase from '@/utils/supabase';

export const DB_COLUMNS = {
  // Parts table
  PARTS: {
    ID: 'id',
    NAME: 'name',
    NUMBER: 'number',
    PRICE: 'price',
    NOTE: 'note',
    CREATED_AT: 'created_at', // Database uses snake_case
    UPDATED_AT: 'updated_at'
  },
  
  // Quotes table
  QUOTES: {
    ID: 'id',
    VIN: 'vin',
    PART_REQUESTED: 'part_requested',
    QUOTE_REF: 'quote_ref',
    CREATED_AT: 'created_at',
    MAKE: 'make',
    MODEL: 'model',
    SERIES: 'series',
    AUTO: 'auto',
    BODY: 'body',
    MTHYR: 'mthyr',
    REGO: 'rego',
    REQUIRED_BY: 'required_by',
    CUSTOMER: 'customer',
    ADDRESS: 'address',
    PHONE: 'phone',
    STATUS: 'status',
    TAX_INVOICE_NUMBER: 'tax_invoice_number'
  },
  
  // Vehicles table
  VEHICLES: {
    ID: 'id',
    REGO: 'rego',
    MAKE: 'make',
    MODEL: 'model',
    SERIES: 'series',
    YEAR: 'year',
    VIN: 'vin',
    COLOR: 'color',
    AUTO: 'auto',
    BODY: 'body',
    NOTES: 'notes',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at'
  }
};

// Helper function to check if column exists
export const checkColumnExists = async (table: string, column: string) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
};

// Helper function to get correct column name
export const getColumnName = (table: string, field: string) => {
  const columns = DB_COLUMNS[table.toUpperCase() as keyof typeof DB_COLUMNS];
  return columns?.[field.toUpperCase() as keyof typeof columns] || field;
};

// Helper function to transform data for database
export const transformForDB = (data: Record<string, any>, table: string) => {
  const transformed: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const dbColumn = getColumnName(table, key);
    transformed[dbColumn] = value;
  });
  
  return transformed;
};

// Helper function to transform data from database
export const transformFromDB = (data: Record<string, any>, table: string) => {
  const transformed: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Convert snake_case to camelCase for app
    const appKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    transformed[appKey] = value;
  });
  
  return transformed;
}; 
// Field Mapping Utilities
// Maps between camelCase (form) and snake_case (database)

export const FIELD_MAPPING = {
  // Quotes table mapping
  QUOTES: {
    // Form field -> Database column
    quoteRef: 'quote_ref',
    partRequested: 'part_requested',
    createdAt: 'created_at',
    requiredBy: 'required_by',
    taxInvoiceNumber: 'tax_invoice_number',
    
    // Database column -> Form field
    quote_ref: 'quoteRef',
    part_requested: 'partRequested',
    created_at: 'createdAt',
    required_by: 'requiredBy',
    tax_invoice_number: 'taxInvoiceNumber',
  },
  
  // Parts table mapping
  PARTS: {
    // Form field -> Database column
    name: 'part_name',
    number: 'part_number',
    price: 'price',
    note: 'note',
    createdAt: 'created_at',
    
    // Database column -> Form field
    part_name: 'name',
    part_number: 'number',
    created_at: 'createdAt',
  }
};

// Transform form data to database format
export const transformFormToDB = (data: Record<string, any>, table: 'QUOTES' | 'PARTS') => {
  const mapping = FIELD_MAPPING[table] as Record<string, string>;
  const transformed: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const dbColumn = mapping[key] || key;
    transformed[dbColumn] = value;
  });
  
  return transformed;
};

// Transform database data to form format
export const transformDBToForm = (data: Record<string, any>, table: 'QUOTES' | 'PARTS') => {
  const mapping = FIELD_MAPPING[table] as Record<string, string>;
  const transformed: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const formField = mapping[key] || key;
    transformed[formField] = value;
  });
  
  return transformed;
};

// Get correct database column name
export const getDBColumnName = (fieldName: string, table: 'QUOTES' | 'PARTS') => {
  const mapping = FIELD_MAPPING[table] as Record<string, string>;
  return mapping[fieldName] || fieldName;
};

// Get correct form field name
export const getFormFieldName = (columnName: string, table: 'QUOTES' | 'PARTS') => {
  const mapping = FIELD_MAPPING[table] as Record<string, string>;
  return mapping[columnName] || columnName;
}; 
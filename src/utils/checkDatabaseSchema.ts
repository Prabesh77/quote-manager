import supabase from '@/utils/supabase';

export const checkDatabaseSchema = async () => {
  console.log('🔍 Checking database schema...');
  
  try {
    // Check parts table structure
    const { data: partsData, error: partsError } = await supabase
      .from('parts')
      .select('*')
      .limit(1);
    
    if (partsError) {
      console.error('❌ Error accessing parts table:', partsError);
    } else {
      console.log('✅ Parts table accessible');
      if (partsData && partsData.length > 0) {
        console.log('📋 Parts table columns:', Object.keys(partsData[0]));
      }
    }
    
    // Check quotes table structure
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .limit(1);
    
    if (quotesError) {
      console.error('❌ Error accessing quotes table:', quotesError);
    } else {
      console.log('✅ Quotes table accessible');
      if (quotesData && quotesData.length > 0) {
        console.log('📋 Quotes table columns:', Object.keys(quotesData[0]));
      }
    }
    
    // Test column names
    const testColumns = async (table: string, columns: string[]) => {
      for (const column of columns) {
        try {
          const { error } = await supabase
            .from(table)
            .select(column)
            .limit(1);
          
          if (error) {
            console.log(`❌ Column '${column}' not found in ${table}`);
          } else {
            console.log(`✅ Column '${column}' exists in ${table}`);
          }
        } catch (err) {
          console.log(`❌ Error testing column '${column}' in ${table}:`, err);
        }
      }
    };
    
    console.log('\n🔍 Testing column names...');
    await testColumns('parts', ['created_at', 'createdAt', 'name', 'number', 'price']);
    await testColumns('quotes', ['created_at', 'createdAt', 'part_requested', 'partRequested']);
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  }
};

// Function to get the correct column name for a table
export const getCorrectColumnName = async (table: string, field: string) => {
  const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
  const camelCase = field;
  
  // Test both versions
  const testColumn = async (columnName: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .select(columnName)
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  };
  
  const snakeExists = await testColumn(snakeCase);
  const camelExists = await testColumn(camelCase);
  
  if (snakeExists) {
    return snakeCase;
  } else if (camelExists) {
    return camelCase;
  } else {
    return field; // Return original if neither exists
  }
};

// Function to transform data for database insertion
export const transformDataForDB = async (data: Record<string, any>, table: string) => {
  const transformed: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const correctColumn = await getCorrectColumnName(table, key);
    transformed[correctColumn] = value;
  }
  
  return transformed;
}; 
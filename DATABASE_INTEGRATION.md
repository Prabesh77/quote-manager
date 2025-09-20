# Database Integration for Parts Rules

This document describes the database integration for the brand-part rules system, which allows dynamic management of automotive part availability rules through a web interface.

## Overview

The system has been migrated from hardcoded rules in `brandPartRules.ts` to a database-driven approach using Supabase. This allows administrators to manage part availability rules through the Settings UI without requiring code changes.

## Database Schema

### `parts_rules` Table

```sql
CREATE TABLE parts_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('required_for', 'not_required_for', 'none')),
    brands TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(part_name)
);
```

#### Fields:
- `id`: Unique identifier (UUID)
- `part_name`: Name of the automotive part (e.g., "Left Headlamp", "Radiator")
- `rule_type`: Type of rule:
  - `required_for`: Part is only available for specified brands
  - `not_required_for`: Part is available for all brands except specified ones
  - `none`: Part is available for all brands (default)
- `brands`: Array of brand names affected by this rule
- `description`: Human-readable description of the rule
- `created_at`/`updated_at`: Timestamps
- `created_by`: User who created the rule

## API Endpoints

### GET `/api/parts-rules`
- **Purpose**: Fetch all parts rules
- **Access**: Public read access
- **Returns**: Array of `PartsRule` objects

### POST `/api/parts-rules`
- **Purpose**: Create a new parts rule
- **Access**: Admin only
- **Body**: `CreatePartsRuleData`
- **Returns**: Created `PartsRule` object

### PUT `/api/parts-rules/[id]`
- **Purpose**: Update an existing parts rule
- **Access**: Admin only
- **Body**: `UpdatePartsRuleData`
- **Returns**: Updated `PartsRule` object

### DELETE `/api/parts-rules/[id]`
- **Purpose**: Delete a parts rule
- **Access**: Admin only
- **Returns**: Success message

## Security

- **Row Level Security (RLS)**: Enabled on `parts_rules` table
- **Read Access**: All authenticated users can read rules
- **Write Access**: Only users with `admin` role can create/update/delete rules
- **Authentication**: Uses Supabase auth with role-based access control

## Migration Process

### 1. Database Setup
Run the SQL migration script:
```bash
# Execute in Supabase SQL Editor
\i create_parts_rules_table.sql
```

### 2. Initial Data
The migration script includes initial data migration from the legacy hardcoded rules:
- All existing rules from `BRAND_PART_RULES_LEGACY` are inserted
- Default admin user is used as `created_by`
- Rules are inserted with `ON CONFLICT DO NOTHING` to prevent duplicates

### 3. Application Updates
- Settings UI now uses React Query hooks for data management
- `brandPartRules.ts` provides backward compatibility
- All existing functionality remains intact

## Usage

### For Administrators

1. **Access Settings**: Navigate to `/settings` (admin role required)
2. **View Rules**: See all current part availability rules
3. **Add New Rule**: Click "Add New Rule" to create a new rule
4. **Edit Rule**: Click the settings icon on any rule to modify it
5. **Delete Rule**: Click the delete button to remove a rule

### For Developers

The system provides both database-driven and legacy compatibility:

```typescript
// Use database-driven rules (recommended)
const { rules, isLoading, error } = useBrandPartRules();

// Legacy compatibility (fallback)
const isAvailable = isPartAvailableForBrand('Radiator', 'Toyota');
```

## Files Modified

### New Files
- `create_parts_rules_table.sql` - Database migration script
- `src/app/api/parts-rules/route.ts` - API endpoints for CRUD operations
- `src/app/api/parts-rules/[id]/route.ts` - Individual rule API endpoints
- `src/services/partsRules/partsRulesService.ts` - Service layer for API calls
- `src/hooks/queries/usePartsRulesQuery.ts` - React Query hooks
- `src/app/(general)/settings/page.tsx` - Settings UI (completely rewritten)

### Modified Files
- `src/config/brandPartRules.ts` - Updated to support database integration
- `src/components/layout/Navigation.tsx` - Added Settings navigation link
- `src/app/(general)/dashboard/page.tsx` - Added Settings card

## Benefits

1. **Dynamic Management**: Rules can be changed without code deployment
2. **User-Friendly**: Non-technical users can manage rules via UI
3. **Audit Trail**: Track who created/modified rules and when
4. **Scalability**: Easy to add new parts and brands
5. **Backward Compatibility**: Existing code continues to work
6. **Role-Based Access**: Only admins can modify rules

## Future Enhancements

1. **Rule History**: Track changes to rules over time
2. **Bulk Import/Export**: Import/export rules via CSV/JSON
3. **Rule Templates**: Predefined rule sets for common scenarios
4. **Validation**: Prevent conflicting rules (e.g., same part required and not required for same brand)
5. **Analytics**: Track rule usage and effectiveness

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure user has `admin` role in profiles table
2. **Rule Not Applied**: Check if rule is properly saved and cache is refreshed
3. **Database Connection**: Verify Supabase connection and RLS policies

### Debug Steps

1. Check browser network tab for API errors
2. Verify user role in Supabase dashboard
3. Check database logs for constraint violations
4. Ensure proper authentication headers are sent

## Rollback Plan

If needed, the system can be rolled back to hardcoded rules by:
1. Reverting `brandPartRules.ts` to use only `BRAND_PART_RULES_LEGACY`
2. Removing the Settings UI navigation links
3. The database table can remain for future use

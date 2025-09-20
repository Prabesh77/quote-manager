'use client';

import { useState } from 'react';
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Settings, Save, RefreshCw, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePartsRulesQuery, useCreatePartsRuleMutation, useUpdatePartsRuleMutation, useDeletePartsRuleMutation } from '@/hooks/queries/usePartsRulesQuery';
import type { PartsRule } from '@/services/partsRules/partsRulesService';

interface PartsRuleFormData {
  partName: string;
  ruleType: 'required_for' | 'not_required_for' | 'none';
  brands: string[];
  description: string;
}

const AVAILABLE_BRANDS = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Hyundai', 'Kia',
  'Ford', 'Holden', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Volvo',
  'Jaguar', 'Land Rover', 'Haval', 'Chery', 'BYD', 'MG', 'Great Wall', 'Geely'
];

const AVAILABLE_PARTS = [
  'Left Headlamp', 'Right Headlamp', 'Left DayLight', 'Right DayLight',
  'Radiator', 'Condenser', 'Fan Assembly', 'Intercooler', 'Left Intercooler', 
  'Right Intercooler', 'Add Cooler', 'Oil Cooler', 'Auxiliary Radiator',
  'Radar Sensor', 'Camera', 'Parking Sensor', 'Left Blindspot Sensor', 
  'Right Blindspot Sensor'
];

export default function SettingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PartsRule | null>(null);
  const [formData, setFormData] = useState<PartsRuleFormData>({
    partName: '',
    ruleType: 'none',
    brands: [],
    description: ''
  });

  // React Query hooks
  const { data: rules = [], isLoading, error, refetch } = usePartsRulesQuery();
  const createMutation = useCreatePartsRuleMutation();
  const updateMutation = useUpdatePartsRuleMutation();
  const deleteMutation = useDeletePartsRuleMutation();

  const handleOpenForm = (rule?: PartsRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        partName: rule.part_name,
        ruleType: rule.rule_type,
        brands: rule.brands || [],
        description: rule.description || ''
      });
    } else {
      setEditingRule(null);
      setFormData({
        partName: '',
        ruleType: 'none',
        brands: [],
        description: ''
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
    setFormData({
      partName: '',
      ruleType: 'none',
      brands: [],
      description: ''
    });
  };

  const handleBrandToggle = (brand: string, ruleType: 'required_for' | 'not_required_for') => {
    setFormData(prev => {
      const currentBrands = prev.brands || [];
      const isSelected = currentBrands.includes(brand);
      
      let newBrands;
      if (isSelected) {
        newBrands = currentBrands.filter(b => b !== brand);
      } else {
        newBrands = [...currentBrands, brand];
      }
      
      return {
        ...prev,
        brands: newBrands,
        ruleType: newBrands.length > 0 ? ruleType : 'none'
      };
    });
  };

  const handleSave = async () => {
    try {
      if (editingRule) {
        await updateMutation.mutateAsync({
          id: editingRule.id,
          part_name: formData.partName,
          rule_type: formData.ruleType,
          brands: formData.brands,
          description: formData.description
        });
      } else {
        await createMutation.mutateAsync({
          part_name: formData.partName,
          rule_type: formData.ruleType,
          brands: formData.brands,
          description: formData.description
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(ruleId);
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const getRuleType = (rule: PartsRule) => {
    if (rule.rule_type === 'required_for') return 'Required For';
    if (rule.rule_type === 'not_required_for') return 'Not Required For';
    return 'Available for All';
  };

  const getRuleBrands = (rule: PartsRule) => {
    if (rule.rule_type === 'none' || !rule.brands || rule.brands.length === 0) {
      return 'All brands';
    }
    return rule.brands.join(', ');
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading parts rules...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Rules</h3>
                <p className="text-red-600 mt-1">Failed to load parts rules. Please try again.</p>
                <Button onClick={() => refetch()} className="mt-3" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="py-6">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Part Rule Settings</h1>
                    <p className="text-gray-600 mt-2">Configure which parts are available for specific car brands.</p>
                  </div>
                  <Button onClick={() => handleOpenForm()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Add New Rule
                  </Button>
                </div>

        {/* Rules List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Part Rules</h2>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-3" />
              <p>No custom rules defined yet. Click "Add New Rule" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{rule.part_name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            rule.rule_type === 'required_for'
                              ? 'bg-green-100 text-green-800' 
                              : rule.rule_type === 'not_required_for'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getRuleType(rule)}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                        )}
                        <div className={`text-base font-semibold ${
                          rule.rule_type === 'required_for'
                            ? 'text-green-700' 
                            : rule.rule_type === 'not_required_for'
                            ? 'text-red-700'
                            : 'text-gray-700'
                        }`}>
                          {getRuleBrands(rule)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2 border-t border-gray-100">
                      <Button
                        onClick={() => handleOpenForm(rule)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(rule.id)}
                        variant="outline"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleteMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRule ? 'Edit Rule' : 'Add New Rule'}
                </h2>
                <Button
                  onClick={handleCloseForm}
                  variant="outline"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Part Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Part Name
                  </label>
                  <select
                    value={formData.partName}
                    onChange={(e) => setFormData(prev => ({ ...prev, partName: e.target.value }))}
                    disabled={!!editingRule}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a part</option>
                    {AVAILABLE_PARTS.map(part => (
                      <option key={part} value={part}>{part}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this rule"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Brand Selection */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Availability Rules
                    </label>
                    <p className="text-sm text-gray-500 mb-4">Choose how this part should be available across different brands</p>
                  </div>

                  {/* Required For */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-green-800 mb-3">
                      ✅ Required For (select brands where this part is required)
                    </label>
                    <p className="text-xs text-green-600 mb-3">Part will only be available for selected brands</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-green-300 rounded-lg p-3 bg-white">
                      {AVAILABLE_BRANDS.map(brand => (
                        <label key={brand} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.ruleType === 'required_for' && formData.brands.includes(brand)}
                            onChange={() => handleBrandToggle(brand, 'required_for')}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{brand}</span>
                        </label>
                      ))}
                    </div>
                    {formData.ruleType === 'required_for' && formData.brands.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-green-600 font-medium">Selected: {formData.brands.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Not Required For */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-red-800 mb-3">
                      ❌ Not Required For (select brands where this part is not required)
                    </label>
                    <p className="text-xs text-red-600 mb-3">Part will be available for all brands except selected ones</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-red-300 rounded-lg p-3 bg-white">
                      {AVAILABLE_BRANDS.map(brand => (
                        <label key={brand} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.ruleType === 'not_required_for' && formData.brands.includes(brand)}
                            onChange={() => handleBrandToggle(brand, 'not_required_for')}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700">{brand}</span>
                        </label>
                      ))}
                    </div>
                    {formData.ruleType === 'not_required_for' && formData.brands.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-red-600 font-medium">Excluded: {formData.brands.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Rule Types:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Required For:</strong> Part will only be available for selected brands</li>
                        <li>• <strong>Not Required For:</strong> Part will be available for all brands except selected ones</li>
                        <li>• <strong>Available for All:</strong> Part will be available for all brands (default)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button 
                  onClick={handleCloseForm} 
                  variant="outline"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!formData.partName || (createMutation.isPending || updateMutation.isPending)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" /> 
                  {editingRule ? 'Update Rule' : 'Save Rule'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
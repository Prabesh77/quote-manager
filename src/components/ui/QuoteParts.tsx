'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuotePart } from './useQuotes';

interface QuotePartsProps {
  quoteId: string;
  parts: QuotePart[];
  onAddPart: (quoteId: string, part: Omit<QuotePart, 'id'>) => Promise<{ error: any }>;
  onUpdatePart: (quoteId: string, partId: string, updates: Partial<QuotePart>) => Promise<{ error: any }>;
  onDeletePart: (quoteId: string, partId: string) => Promise<{ error: any }>;
}

export const QuoteParts = ({ quoteId, parts, onAddPart, onUpdatePart, onDeletePart }: QuotePartsProps) => {
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [newPart, setNewPart] = useState({ partName: '', partNumber: '', price: '', notes: '' });
  const [editingPart, setEditingPart] = useState<QuotePart | null>(null);

  const handleAddPart = async () => {
    if (!newPart.partName.trim()) return;
    
    const { error } = await onAddPart(quoteId, {
      partName: newPart.partName,
      partNumber: newPart.partNumber,
      price: newPart.price,
      notes: newPart.notes,
    });

    if (!error) {
      setNewPart({ partName: '', partNumber: '', price: '', notes: '' });
      setIsAddingPart(false);
    }
  };

  const handleUpdatePart = async () => {
    if (!editingPart) return;
    
    const { error } = await onUpdatePart(quoteId, editingPart.id, {
      partName: editingPart.partName,
      partNumber: editingPart.partNumber,
      price: editingPart.price,
      notes: editingPart.notes,
    });

    if (!error) {
      setEditingPartId(null);
      setEditingPart(null);
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (confirm('Are you sure you want to delete this part?')) {
      await onDeletePart(quoteId, partId);
    }
  };

  const startEditing = (part: QuotePart) => {
    setEditingPartId(part.id);
    setEditingPart({ ...part });
  };

  const cancelEditing = () => {
    setEditingPartId(null);
    setEditingPart(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold">Parts ({parts.length})</h4>
        <Button
          onClick={() => setIsAddingPart(true)}
          size="sm"
          className="cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Part
        </Button>
      </div>

      {/* Add New Part Form */}
      {isAddingPart && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Part Name"
              value={newPart.partName}
              onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
            />
            <Input
              placeholder="Part Number"
              value={newPart.partNumber}
              onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
            />
            <Input
              placeholder="Price"
              value={newPart.price}
              onChange={(e) => setNewPart({ ...newPart, price: e.target.value })}
            />
            <Input
              placeholder="Notes"
              value={newPart.notes}
              onChange={(e) => setNewPart({ ...newPart, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleAddPart} size="sm" className="cursor-pointer">
              <Save className="w-4 h-4 mr-1" />
              Save Part
            </Button>
            <Button
              onClick={() => {
                setIsAddingPart(false);
                setNewPart({ partName: '', partNumber: '', price: '', notes: '' });
              }}
              size="sm"
              variant="ghost"
              className="cursor-pointer"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Parts List */}
      <div className="space-y-2">
        {parts.map((part) => (
          <div key={part.id} className="border rounded-lg p-3">
            {editingPartId === part.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Part Name"
                    value={editingPart?.partName || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, partName: e.target.value } : null)}
                  />
                  <Input
                    placeholder="Part Number"
                    value={editingPart?.partNumber || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, partNumber: e.target.value } : null)}
                  />
                  <Input
                    placeholder="Price"
                    value={editingPart?.price || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, price: e.target.value } : null)}
                  />
                  <Input
                    placeholder="Notes"
                    value={editingPart?.notes || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, notes: e.target.value } : null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdatePart} size="sm" className="cursor-pointer">
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button onClick={cancelEditing} size="sm" variant="ghost" className="cursor-pointer">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Part:</span>
                      <p className="text-sm">{part.partName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Part #:</span>
                      <p className="text-sm">{part.partNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Price:</span>
                      <p className="text-sm">{part.price || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Notes:</span>
                      <p className="text-sm">{part.notes || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => startEditing(part)}
                    className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors cursor-pointer"
                    title="Edit Part"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeletePart(part.id)}
                    className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete Part"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {parts.length === 0 && !isAddingPart && (
        <div className="text-center py-8 text-gray-500">
          <p>No parts added yet. Click "Add Part" to get started.</p>
        </div>
      )}
    </div>
  );
}; 
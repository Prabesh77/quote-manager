'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Part } from './useQuotes';

interface PartsManagerProps {
  parts: Part[];
  onAddPart: (part: Omit<Part, 'id' | 'createdAt'>) => Promise<{ data: Part; error: Error | null }>;
  onUpdatePart: (id: string, updates: Partial<Part>) => Promise<{ data: Part; error: Error | null }>;
  onDeletePart: (id: string) => Promise<{ error: Error | null }>;
}

export const PartsManager = ({ parts, onAddPart, onUpdatePart, onDeletePart }: PartsManagerProps) => {
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [newPart, setNewPart] = useState({ name: '', number: '', price: '', note: '' });
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  const handleAddPart = async () => {
    if (!newPart.name.trim()) return;
    
    const { error } = await onAddPart({
      name: newPart.name,
      number: newPart.number,
      price: newPart.price ? Number(newPart.price) : null,
      list_price: null,
      af: false,
      note: newPart.note,
    });

    if (!error) {
      setNewPart({ name: '', number: '', price: '', note: '' });
      setIsAddingPart(false);
    }
  };

  const handleUpdatePart = async () => {
    if (!editingPart) return;
    
    const { error } = await onUpdatePart(editingPart.id, {
      name: editingPart.name,
      number: editingPart.number,
      price: editingPart.price,
      list_price: editingPart.list_price,
      af: editingPart.af,
      note: editingPart.note,
    });

    if (!error) {
      setEditingPartId(null);
      setEditingPart(null);
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (confirm('Are you sure you want to delete this part?')) {
      await onDeletePart(partId);
    }
  };

  const startEditing = (part: Part) => {
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
        <h3 className="text-lg font-semibold">Parts Management ({parts.length})</h3>
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
              value={newPart.name}
              onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
            />
            <Input
              placeholder="Part Number"
              value={newPart.number}
              onChange={(e) => setNewPart({ ...newPart, number: e.target.value })}
            />
            <Input
              placeholder="Price"
              value={newPart.price}
              onChange={(e) => setNewPart({ ...newPart, price: e.target.value })}
            />
            <Input
              placeholder="Notes"
              value={newPart.note}
              onChange={(e) => setNewPart({ ...newPart, note: e.target.value })}
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
                setNewPart({ name: '', number: '', price: '', note: '' });
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
                    value={editingPart?.name || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, name: e.target.value } : null)}
                  />
                  <Input
                    placeholder="Part Number"
                    value={editingPart?.number || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, number: e.target.value } : null)}
                  />
                  <Input
                    placeholder="Price"
                    value={editingPart?.price?.toString() || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, price: e.target.value ? Number(e.target.value) : null } : null)}
                  />
                  <Input
                    placeholder="Notes"
                    value={editingPart?.note || ''}
                    onChange={(e) => setEditingPart(editingPart ? { ...editingPart, note: e.target.value } : null)}
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
                      <p className="text-sm">{part.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Part #:</span>
                      <p className="text-sm">{part.number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Price:</span>
                      <p className="text-sm">{part.price || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Notes:</span>
                      <p className="text-sm">{part.note || 'N/A'}</p>
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
          <p>No parts available. Click &quot;Add Part&quot; to get started.</p>
        </div>
      )}
    </div>
  );
}; 
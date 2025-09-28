'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useUserProfile } from '@/hooks/useUserProfile';
import supabase from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSnackbar } from '@/components/ui/Snackbar';
import { Plus, X, Edit, Power, PowerOff, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  role: 'quote_creator' | 'price_manager' | 'quality_controller' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  username: string;
  full_name: string;
  role: 'quote_creator' | 'price_manager' | 'quality_controller' | 'admin';
}

export default function UserManagementPage() {
  // const { profile: currentUserProfile } = useUserProfile(); // Temporarily comment out
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    username: '',
    full_name: '',
    role: 'quote_creator'
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    role: 'quote_creator' as UserProfile['role'],
    is_active: true
  });
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        // Remove showSnackbar to see if it's causing the loop
        // showSnackbar('Failed to fetch users', 'error');
        return;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Remove showSnackbar to see if it's causing the loop
      // showSnackbar('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.username || !createForm.full_name) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      setCreatingUser(true);

      // Call our API endpoint to create user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      showSnackbar('User created successfully', 'success');
      
      // Reset form and hide it
      setCreateForm({
        email: '',
        password: '',
        username: '',
        full_name: '',
        role: 'quote_creator'
      });
      setShowCreateForm(false);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      showSnackbar(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username,
      full_name: user.full_name || '',
      role: user.role,
      is_active: user.is_active
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(editForm)
        .eq('id', editingUser);

      if (error) throw error;

      showSnackbar('User updated successfully', 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showSnackbar('Failed to update user', 'error');
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({
      username: '',
      full_name: '',
      role: 'quote_creator',
      is_active: true
    });
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      showSnackbar(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`, 'success');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showSnackbar('Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeletingUser(userId);
      
      // Call our API endpoint to delete user
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      showSnackbar('User deleted successfully', 'success');
      setShowDeleteConfirm(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setDeletingUser(null);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'quote_creator': return 'Quote Creator';
      case 'price_manager': return 'Price Manager';
      case 'quality_controller': return 'Quality Controller';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'quality_controller': return 'bg-purple-100 text-purple-800';
      case 'price_manager': return 'bg-blue-100 text-blue-800';
      case 'quote_creator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage users, roles, and permissions</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-red-600 hover:bg-red-700 cursor-pointer"
            title={showCreateForm ? "Cancel creating user" : "Create a new user"}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create User'}
          </Button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded hover:bg-gray-100 transition-colors"
                title="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  className="cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                  required
                  className="cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <Input
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="username"
                  required
                  className="cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <Input
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Full Name"
                  required
                  className="cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as CreateUserForm['role'] })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm cursor-pointer"
                >
                  <option value="quote_creator">Quote Creator</option>
                  <option value="price_manager">Price Manager</option>
                  <option value="quality_controller">Quality Controller</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="cursor-pointer"
                title="Cancel creating user"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={creatingUser}
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                title={creatingUser ? "Creating user..." : "Create new user"}
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        )}

        {/* Users Table - Desktop View */}
        <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            placeholder="Username"
                            className="w-32 cursor-pointer"
                          />
                          <Input
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            placeholder="Full Name"
                            className="w-32 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.full_name || 'No name'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserProfile['role'] })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm cursor-pointer"
                        >
                          <option value="quote_creator">Quote Creator</option>
                          <option value="price_manager">Price Manager</option>
                          <option value="quality_controller">Quality Controller</option>
                          <option value="admin">Administrator</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.is_active}
                            onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-900">Active</span>
                        </label>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser === user.id ? (
                        <div className="flex space-x-2 justify-end">
                          <Button
                            onClick={handleSave}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 cursor-pointer"
                            title="Save changes"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancel}
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            title="Cancel editing"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2 justify-end">
                          <Button
                            onClick={() => handleEdit(user)}
                            size="sm"
                            variant="outline"
                            className="p-2 h-8 w-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            size="sm"
                            variant={user.is_active ? "outline" : "default"}
                            className={`p-2 h-8 w-8 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
                              user.is_active 
                                ? "text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 bg-white" 
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                            title={user.is_active ? "Deactivate user" : "Activate user"}
                          >
                            {user.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            size="sm"
                            variant="outline"
                            className="p-2 h-8 w-8 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Cards - Mobile View */}
        <div className="md:hidden space-y-4">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {editingUser === user.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <Input
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="Username"
                        className="w-full cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <Input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        placeholder="Full Name"
                        className="w-full cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserProfile['role'] })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      >
                        <option value="quote_creator">Quote Creator</option>
                        <option value="price_manager">Price Manager</option>
                        <option value="quality_controller">Quality Controller</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-900">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex-1 cursor-pointer"
                      title="Save changes"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="sm"
                      variant="outline"
                      className="flex-1 cursor-pointer"
                      title="Cancel editing"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="text-lg font-semibold text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.full_name || 'No name'}</div>
                    </div>
                    <div className="flex flex-col space-y-2 flex-shrink-0">
                      <Button
                        onClick={() => handleEdit(user)}
                        size="sm"
                        variant="outline"
                        className="p-2 h-8 w-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        size="sm"
                        variant={user.is_active ? "outline" : "default"}
                        className={`p-2 h-8 w-8 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
                          user.is_active 
                            ? "text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 bg-white" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                        title={user.is_active ? "Deactivate user" : "Activate user"}
                      >
                        {user.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        size="sm"
                        variant="outline"
                        className="p-2 h-8 w-8 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Role and Status */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="text-sm text-gray-500">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No users found</div>
            <div className="text-gray-400 text-sm mt-2">Create your first user to get started</div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="flex space-x-3 justify-center">
                  <Button
                    onClick={() => setShowDeleteConfirm(null)}
                    variant="outline"
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                    disabled={deletingUser === showDeleteConfirm}
                    className="bg-red-600 hover:bg-red-700 cursor-pointer"
                  >
                    {deletingUser === showDeleteConfirm ? 'Deleting...' : 'Delete User'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

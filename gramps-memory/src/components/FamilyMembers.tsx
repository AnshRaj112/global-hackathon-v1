'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FamilyMember } from '../utils/email';

export default function FamilyMembers() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    relationship: ''
  });
  const { user } = useAuth();

  const fetchFamilyMembers = useCallback(async () => {
    if (!supabase || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching family members:', error);
        return;
      }

      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFamilyMembers();
    }
  }, [user, fetchFamilyMembers]);

  const addFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user || !newMember.name || !newMember.email || !newMember.relationship) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert([
          {
            name: newMember.name,
            email: newMember.email,
            relationship: newMember.relationship,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding family member:', error);
        alert('Error adding family member. Please try again.');
        return;
      }

      setFamilyMembers([data, ...familyMembers]);
      setNewMember({ name: '', email: '', relationship: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding family member:', error);
      alert('Error adding family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteFamilyMember = async (id: string) => {
    if (!supabase) return;

    if (!confirm('Are you sure you want to remove this family member?')) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting family member:', error);
        alert('Error removing family member. Please try again.');
        return;
      }

      setFamilyMembers(familyMembers.filter(member => member.id !== id));
    } catch (error) {
      console.error('Error deleting family member:', error);
      alert('Error removing family member. Please try again.');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-main">Family Members</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add Family Member'}
        </button>
      </div>

      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-main mb-4">Add New Family Member</h3>
          <form onSubmit={addFamilyMember} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                placeholder="Enter family member's name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <select
                id="relationship"
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                required
              >
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Grandchild">Grandchild</option>
                <option value="Sibling">Sibling</option>
                <option value="Parent">Parent</option>
                <option value="Niece/Nephew">Niece/Nephew</option>
                <option value="Cousin">Cousin</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 btn-primary disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Family Member'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 btn-primary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && familyMembers.length === 0 ? (
        <div className="text-center py-8 text-secondary">Loading family members...</div>
      ) : familyMembers.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <p className="text-lg">No family members yet</p>
          <p className="text-sm">Add family members to share your memories with them!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {familyMembers.map((member) => (
            <div key={member.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-main">{member.name}</h3>
                  <p className="text-secondary">{member.email}</p>
                  <p className="text-sm text-secondary bg-gray-100 px-2 py-1 rounded inline-block mt-2">
                    {member.relationship}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Added: {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteFamilyMember(member.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">About Family Sharing</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Family members will receive beautifully formatted emails when you create blog posts</li>
          <li>• They can read your memories and stories in a professional format</li>
          <li>• You can add as many family members as you&apos;d like</li>
          <li>• You can remove family members at any time</li>
        </ul>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';
import { addRecord } from '../services/offlineDB';
import { Party } from '../types';
import { Button, Input, Card } from '../components/UI';
import { Trash2, Edit, Users, Search, RefreshCw } from '../components/Icons';
import { useInventory } from '../src/context/InventoryContext';

const Parties: React.FC = () => {
  const { parties, loading, initialLoadDone, fetchInitialData } = useInventory();
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: ''
  });
  
  const [partyToDelete, setPartyToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!initialLoadDone) {
      fetchInitialData();
    }
  }, [initialLoadDone, fetchInitialData]);

  const resetForm = () => {
    setFormData({ name: '', address: '', contact: '' });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (party: Party) => {
    setFormData({
      name: party.name,
      address: party.address,
      contact: party.contact
    });
    setCurrentId(party.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Party Name is required');

    try {
      setIsSaving(true);
      const party: Party = {
        id: currentId || crypto.randomUUID(),
        name: formData.name,
        address: formData.address,
        contact: formData.contact,
        createdAt: Date.now(),
        synced: 1,
        deleted: 0
      };

      // Ensure we use snake_case for the DB fields as expected by addRecord
      const dbParty = {
        id: party.id,
        name: party.name,
        address: party.address,
        contact: party.contact,
        created_at: new Date(party.createdAt).toISOString()
      };

      await addRecord('parties', dbParty);
      console.log("Party saved successfully:", dbParty);
      
      // Refresh context state
      await fetchInitialData(true);
      resetForm();
    } catch (error) {
      alert('Failed to save party. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (partyToDelete) {
      try {
        await inventoryService.deleteParty(partyToDelete);
        setPartyToDelete(null);
      } catch (error) {
        alert('Failed to delete party. Please try again.');
      }
    }
  };

  const filteredParties = parties.filter(party => 
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      {/* Add/Edit Form */}
      <Card className="border-primary/20 shadow-md">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
           <Users className="text-primary w-5 h-5" />
           <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">{isEditing ? 'Edit Party' : 'Add New Party'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Party Name"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. ABC Pharma"
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            placeholder="City, Area"
          />
          <Input
            label="Contact Number"
            value={formData.contact}
            onChange={e => setFormData({...formData, contact: e.target.value})}
            type="tel"
            placeholder="9876543210"
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : (isEditing ? 'Update Party' : 'Add Party')}
            </Button>
            {(isEditing || formData.name || formData.address || formData.contact) && (
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Search & List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
           <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider ml-1">Saved Parties</h3>
           <button onClick={() => fetchInitialData(true)} className={`p-1 text-gray-400 hover:text-primary ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
           </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Search saved parties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {loading && parties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-gray-500">Loading parties...</p>
          </div>
        ) : filteredParties.length === 0 ? (
            <p className="text-gray-400 italic ml-1 text-center py-4">
                {searchTerm ? 'No parties match your search.' : 'No parties added yet.'}
            </p>
        ) : (
          filteredParties.map(party => (
            <div key={party.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-100">{party.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{party.address}</p>
                {party.contact && <p className="text-xs text-gray-400 mt-1">📞 {party.contact}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(party)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setPartyToDelete(party.id)} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {partyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Party?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Are you sure you want to delete this party? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setPartyToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parties;

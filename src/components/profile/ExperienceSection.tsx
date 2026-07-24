import React, { useState } from 'react';
import { Briefcase, MapPin, Calendar, Plus, Trash2, Edit3, Sprout, Check, X } from 'lucide-react';
import { ExperienceItem } from '../../types';
import { safeString } from '../../lib/utils';

interface ExperienceSectionProps {
  items: ExperienceItem[];
  isMyOwnProfile: boolean;
  onSaveItems?: (updated: ExperienceItem[]) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  items = [],
  isMyOwnProfile,
  onSaveItems
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [role, setRole] = useState('');
  const [farmOrOrg, setFarmOrOrg] = useState('');
  const [location, setLocation] = useState('');
  const [period, setPeriod] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setRole('');
    setFarmOrOrg('');
    setLocation('');
    setPeriod('');
    setDescription('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (item: ExperienceItem) => {
    setRole(item.role);
    setFarmOrOrg(item.farmOrOrg);
    setLocation(item.location || '');
    setPeriod(item.period);
    setDescription(item.description || '');
    setEditingId(item.id);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !farmOrOrg.trim()) return;

    if (editingId) {
      const updated = items.map(item => 
        item.id === editingId 
          ? { ...item, role, farmOrOrg, location, period, description }
          : item
      );
      onSaveItems?.(updated);
    } else {
      const newItem: ExperienceItem = {
        id: `exp-${Date.now()}`,
        role,
        farmOrOrg,
        location,
        period,
        description
      };
      onSaveItems?.([newItem, ...items]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    onSaveItems?.(updated);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-700" />
            Farming & Agricultural Experience
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Key farming roles, management history, and agricultural involvement
          </p>
        </div>

        {isMyOwnProfile && !isAdding && !editingId && (
          <button
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Experience
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              {editingId ? 'Edit Farming Experience' : 'New Farming Experience'}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Role / Specialization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Progressive Farmer, Farm Owner"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Farm Name / Organization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Green Valley Organic Farm"
                value={farmOrOrg}
                onChange={e => setFarmOrOrg(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Karnal, Haryana"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Time Period</label>
              <input
                type="text"
                placeholder="e.g. 2018 – Present"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Key Focus & Practices</label>
            <textarea
              rows={2}
              placeholder="e.g. Wheat, Mustard and sustainable zero-budget farming practices."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Save Experience
            </button>
          </div>
        </form>
      )}

      {/* List of Experiences */}
      {items.length === 0 ? (
        <div className="py-8 px-4 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <p className="text-sm text-stone-600 font-medium">No farming experience added yet.</p>
          <p className="text-xs text-stone-400 mt-1">
            Display your active farm management history and agricultural roles.
          </p>
          {isMyOwnProfile && !isAdding && (
            <button
              onClick={handleStartAdd}
              className="mt-3.5 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Experience
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-6 space-y-6 before:absolute before:left-2 sm:before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[19px] sm:-left-[23px] top-1.5 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />

              <div className="bg-stone-50/60 p-4 rounded-xl border border-stone-100 hover:border-emerald-200 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{safeString(item.role)}</h4>
                    <p className="text-xs font-semibold text-emerald-800">{safeString(item.farmOrOrg)}</p>
                  </div>

                  {isMyOwnProfile && (
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-stone-400 hover:text-emerald-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500 mt-2 flex-wrap">
                  {item.period && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {item.period}
                    </span>
                  )}

                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {item.location}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-100">
                    <span className="font-medium text-stone-700">Focus: </span>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

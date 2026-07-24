import React, { useState } from 'react';
import { Award, Plus, Trash2, Edit3, Check, X, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';
import { AchievementItem } from '../../types';
import { safeString } from '../../lib/utils';

interface AchievementsSectionProps {
  items: AchievementItem[];
  isMyOwnProfile: boolean;
  onSaveItems?: (updated: AchievementItem[]) => void;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  items = [],
  isMyOwnProfile,
  onSaveItems
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState<'award' | 'training' | 'recognition' | 'badge'>('award');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setTitle('');
    setOrganization('');
    setYear('');
    setType('award');
    setDescription('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (item: AchievementItem) => {
    setTitle(item.title);
    setOrganization(item.organization);
    setYear(item.year);
    setType(item.type);
    setDescription(item.description || '');
    setEditingId(item.id);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organization.trim()) return;

    if (editingId) {
      const updated = items.map(item => 
        item.id === editingId 
          ? { ...item, title, organization, year, type, description }
          : item
      );
      onSaveItems?.(updated);
    } else {
      const newItem: AchievementItem = {
        id: `ach-${Date.now()}`,
        title,
        organization,
        year,
        type,
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

  const getTypeBadge = (itemType: string) => {
    switch (itemType) {
      case 'award':
        return { label: 'Award', icon: Award, color: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'training':
        return { label: 'Training', icon: GraduationCap, color: 'bg-blue-50 text-blue-900 border-blue-200' };
      case 'recognition':
        return { label: 'Recognition', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
      default:
        return { label: 'Milestone', icon: Sparkles, color: 'bg-stone-100 text-stone-800 border-stone-200' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Achievements & Certifications
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Agricultural awards, training credentials, and community recognitions
          </p>
        </div>

        {isMyOwnProfile && !isAdding && !editingId && (
          <button
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Achievement
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              {editingId ? 'Edit Achievement' : 'New Achievement'}
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">Title / Honor *</label>
              <input
                type="text"
                required
                placeholder="e.g. Best Farmer Honor (जिला सर्वोत्तम किसान सम्मान)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Issuing Board / Org *</label>
              <input
                type="text"
                required
                placeholder="e.g. Agriculture Development Board, ICAR, IARI"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Year</label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Category</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="award">Award / Recognition</option>
                <option value="training">Training / Certification</option>
                <option value="recognition">Official Pioneer / Scheme</option>
                <option value="badge">Farming Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Received for organic wheat yield milestone"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>
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
              Save Achievement
            </button>
          </div>
        </form>
      )}

      {/* List of Achievements */}
      {items.length === 0 ? (
        <div className="py-8 px-4 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <p className="text-sm text-stone-600 font-medium">No achievements or awards recorded yet.</p>
          <p className="text-xs text-stone-400 mt-1">
            Add genuine agricultural honors, training certificates, or community awards.
          </p>
          {isMyOwnProfile && !isAdding && (
            <button
              onClick={handleStartAdd}
              className="mt-3.5 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Achievement
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {items.map((item) => {
            const badgeMeta = getTypeBadge(item.type);
            const Icon = badgeMeta.icon;

            return (
              <div 
                key={item.id} 
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeMeta.color}`}>
                      <Icon className="w-3 h-3" />
                      {badgeMeta.label}
                    </span>

                    {item.year && (
                      <span className="text-xs font-semibold text-stone-400">{safeString(item.year)}</span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 leading-snug">{safeString(item.title)}</h4>
                  <p className="text-xs text-stone-500 mt-1 font-medium">{safeString(item.organization)}</p>

                  {item.description && (
                    <p className="text-xs text-stone-600 mt-2 line-clamp-2">{safeString(item.description)}</p>
                  )}
                </div>

                {isMyOwnProfile && (
                  <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-stone-100 opacity-80 group-hover:opacity-100 transition-opacity">
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
            );
          })}
        </div>
      )}
    </div>
  );
};

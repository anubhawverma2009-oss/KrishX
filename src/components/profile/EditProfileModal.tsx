import React, { useState } from 'react';
import { X, Check, Sprout, User, MapPin, Plus, Trash2, Globe, Heart, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { safeString, safeNumber, safeArrayOfStrings } from '../../lib/utils';

interface EditProfileModalProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<UserProfile>) => Promise<void>;
  triggerToast: (msg: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  userProfile,
  isOpen,
  onClose,
  onSave,
  triggerToast
}) => {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<'basic' | 'agriculture' | 'additional'>('basic');
  const [loading, setLoading] = useState(false);

  // Form States
  const [name, setName] = useState(safeString(userProfile?.name));
  const [role, setRole] = useState(safeString(userProfile?.role));
  const [bio, setBio] = useState(safeString(userProfile?.bio || userProfile?.summary));
  const [location, setLocation] = useState(safeString(userProfile?.location));
  const [photoURL, setPhotoURL] = useState(safeString(userProfile?.photoURL));
  const [coverImage, setCoverImage] = useState(safeString(userProfile?.coverImage));
  const [experienceYears, setExperienceYears] = useState(safeNumber(userProfile?.experienceYears, 0));

  // Multi-item chips states
  const [crops, setCrops] = useState<string[]>(safeArrayOfStrings(userProfile?.currentCrops || userProfile?.crops));
  const [newCropInput, setNewCropInput] = useState('');

  const rawSkills = safeArrayOfStrings(userProfile?.skills);
  const rawPractices = safeArrayOfStrings(userProfile?.farmingPractices);
  const derivedPractices = rawPractices.length > 0 
    ? rawPractices 
    : rawSkills.filter(s => s.toLowerCase().includes('farming') || s.toLowerCase().includes('irrigation') || s.toLowerCase().includes('organic'));

  const [farmingPractices, setFarmingPractices] = useState<string[]>(derivedPractices);
  const [newPracticeInput, setNewPracticeInput] = useState('');

  const rawExpertise = safeArrayOfStrings(userProfile?.expertise);
  const derivedExpertise = rawExpertise.length > 0
    ? rawExpertise
    : rawSkills.filter(s => !derivedPractices.includes(s));

  const [expertise, setExpertise] = useState<string[]>(derivedExpertise);
  const [newExpertiseInput, setNewExpertiseInput] = useState('');

  const [interests, setInterests] = useState<string[]>(safeArrayOfStrings(userProfile?.interests));
  const [newInterestInput, setNewInterestInput] = useState('');

  const [languages, setLanguages] = useState<string[]>(
    userProfile?.languages ? safeArrayOfStrings(userProfile.languages) : ['Hindi', 'English']
  );
  const [newLanguageInput, setNewLanguageInput] = useState('');

  const [education, setEducation] = useState(safeString(userProfile?.education));

  // Handlers for adding chips
  const addChip = (
    input: string, 
    setInput: (v: string) => void, 
    list: string[], 
    setList: (l: string[]) => void
  ) => {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setInput('');
    }
  };

  const removeChip = (itemToRemove: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.filter(item => item !== itemToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedData: Partial<UserProfile> = {
        name,
        role: role || (crops.length > 0 ? `Progressive Farmer • ${crops.slice(0, 2).join(' & ')}` : 'Agriculture Professional'),
        bio,
        summary: bio,
        location,
        photoURL,
        coverImage,
        experienceYears: Number(experienceYears) || 0,
        crops,
        currentCrops: crops,
        farmingPractices,
        expertise,
        skills: [...farmingPractices, ...expertise],
        interests,
        languages,
        education
      };

      await onSave(updatedData);
      triggerToast('Farm profile updated successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      triggerToast('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              Edit Farmer Profile
            </h3>
            <p className="text-xs text-stone-500">
              Update your digital agricultural identity & farming details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-100/50 px-4 sm:px-6 gap-2 pt-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
              activeSection === 'basic'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('agriculture')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
              activeSection === 'agriculture'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Agriculture & Crops
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('additional')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
              activeSection === 'additional'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Languages & Education
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Agricultural Tagline / Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Progressive Farmer • Wheat & Mustard"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Bio / Journey Summary</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Tell the KrishX community about your farm and agricultural journey..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Karnal, Haryana"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Farming Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    max={70}
                    value={experienceYears}
                    onChange={e => setExperienceYears(Number(e.target.value))}
                    className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Profile Photo URL</label>
                  <input
                    type="url"
                    value={photoURL}
                    onChange={e => setPhotoURL(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'agriculture' && (
            <div className="space-y-4">
              {/* Current Crops */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Current Crops Currently Growing</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a crop (e.g. Wheat, Mustard, Sugarcane)"
                    value={newCropInput}
                    onChange={e => setNewCropInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChip(newCropInput, setNewCropInput, crops, setCrops);
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addChip(newCropInput, setNewCropInput, crops, setCrops)}
                    className="px-3 py-2 bg-emerald-800 text-white rounded-lg text-xs font-medium hover:bg-emerald-900"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {crops.map((crop, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200">
                      {crop}
                      <button type="button" onClick={() => removeChip(crop, crops, setCrops)} className="text-emerald-700 hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Farming Practices */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Farming Practices</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Organic Farming, Drip Irrigation, Zero Budget"
                    value={newPracticeInput}
                    onChange={e => setNewPracticeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChip(newPracticeInput, setNewPracticeInput, farmingPractices, setFarmingPractices);
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addChip(newPracticeInput, setNewPracticeInput, farmingPractices, setFarmingPractices)}
                    className="px-3 py-2 bg-blue-800 text-white rounded-lg text-xs font-medium hover:bg-blue-900"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {farmingPractices.map((p, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-medium border border-blue-200">
                      {p}
                      <button type="button" onClick={() => removeChip(p, farmingPractices, setFarmingPractices)} className="text-blue-700 hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Farm Expertise */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Farm Expertise</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Soil Health, Pest Control, Crop Rotation"
                    value={newExpertiseInput}
                    onChange={e => setNewExpertiseInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChip(newExpertiseInput, setNewExpertiseInput, expertise, setExpertise);
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addChip(newExpertiseInput, setNewExpertiseInput, expertise, setExpertise)}
                    className="px-3 py-2 bg-amber-800 text-white rounded-lg text-xs font-medium hover:bg-amber-900"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {expertise.map((e, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200">
                      {e}
                      <button type="button" onClick={() => removeChip(e, expertise, setExpertise)} className="text-amber-700 hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Agricultural Interests */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Agricultural Interests</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. AgriTech, Solar Irrigation, Natural Fertilizers"
                    value={newInterestInput}
                    onChange={e => setNewInterestInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChip(newInterestInput, setNewInterestInput, interests, setInterests);
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addChip(newInterestInput, setNewInterestInput, interests, setInterests)}
                    className="px-3 py-2 bg-stone-700 text-white rounded-lg text-xs font-medium hover:bg-stone-800"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200">
                      {item}
                      <button type="button" onClick={() => removeChip(item, interests, setInterests)} className="text-stone-500 hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'additional' && (
            <div className="space-y-4">
              {/* Languages */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Languages Spoken</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Hindi, English, Punjabi"
                    value={newLanguageInput}
                    onChange={e => setNewLanguageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChip(newLanguageInput, setNewLanguageInput, languages, setLanguages);
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addChip(newLanguageInput, setNewLanguageInput, languages, setLanguages)}
                    className="px-3 py-2 bg-stone-700 text-white rounded-lg text-xs font-medium hover:bg-stone-800"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((lang, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200">
                      {lang}
                      <button type="button" onClick={() => removeChip(lang, languages, setLanguages)} className="text-stone-500 hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Education / Agriculture Training</label>
                <input
                  type="text"
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. B.Sc Agriculture, ICAR Training, Self-taught Organic Farmer"
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

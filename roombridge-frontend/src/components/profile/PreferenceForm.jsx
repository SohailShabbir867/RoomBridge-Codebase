import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { RiSaveLine, RiLoader4Line, RiCheckLine } from 'react-icons/ri';
import { CITIES } from '../../utils/constants';

/*
  PreferenceForm — lifestyle preference form for roommate matching.

  FIELD MAP (form → backend Preference.model.js):
    sleepSchedule    → sleepSchedule    (enum: early | late | flexible)
    smoker           → smoker           (boolean)
    pets             → pets             (boolean)
    cleanliness      → cleanliness      (number 1-5)
    occupation       → occupation       (enum: student | professional)
    gender           → gender           (enum: male | female)
    genderPreference → genderPreference (enum: male | female | any)
    bio              → bio              (string max 300)
    budget           → budget           (number, min 1000)
    preferredCity    → preferredCity    (enum: PAKISTAN_CITIES)

  Props:
    initialValues: object — existing saved preference (or null)
    onSaved: (pref) => void — called after successful save
    compact: bool — compact layout (for embedding in a panel)
*/

const SLEEP_OPTIONS = [
  { value: 'early',    label: 'Early Bird 🌅' },
  { value: 'late',     label: 'Night Owl 🦉' },
  { value: 'flexible', label: 'Flexible 🔄' },
];

const OCCUPATION_OPTIONS = [
  { value: 'student',      label: 'Student 📚' },
  { value: 'professional', label: 'Professional 💼' },
];

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
];

const GENDER_PREF_OPTIONS = [
  { value: 'any',    label: 'Any' },
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
];

const OptionButton = ({ options, value, onChange, name }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(name, value === opt.value ? '' : opt.value)}
        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                    ${value === opt.value
                      ? 'bg-primary text-white border-primary shadow-card'
                      : 'bg-white border-border text-text-secondary hover:border-primary hover:text-primary'}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const PreferenceForm = ({
  initialValues = null,
  onSaved,
  compact = false,
}) => {
  const [form, setForm] = useState({
    sleepSchedule:    initialValues?.sleepSchedule    || '',
    smoker:           initialValues?.smoker === true,
    pets:             initialValues?.pets === true,
    cleanliness:      initialValues?.cleanliness      || 3,
    occupation:       initialValues?.occupation       || '',
    gender:           initialValues?.gender           || '',
    genderPreference: initialValues?.genderPreference || 'any',
    bio:              initialValues?.bio              || '',
    budget:           initialValues?.budget           || '',
    preferredCity:    initialValues?.preferredCity    || '',
  });

  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const handleField = (name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.sleepSchedule || !form.occupation || !form.gender) {
      toast.error('Please fill in Sleep Schedule, Occupation, and Gender.');
      return;
    }
    if (!form.cleanliness || form.cleanliness < 1 || form.cleanliness > 5) {
      toast.error('Please set a cleanliness level (1-5).');
      return;
    }

    try {
      setSaving(true);
      const res  = await api.post('/preferences', form);
      const pref = res.data?.preference || res.data?.data;
      setSuccess(true);
      toast.success('Preferences saved!');
      if (onSaved) onSaved(pref);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const labelClass = 'block text-sm font-semibold text-primary mb-2';

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-6'}>

      {/* Sleep Schedule */}
      <div>
        <label className={labelClass}>Sleep Schedule *</label>
        <OptionButton
          name="sleepSchedule"
          options={SLEEP_OPTIONS}
          value={form.sleepSchedule}
          onChange={handleField}
        />
      </div>

      {/* Occupation */}
      <div>
        <label className={labelClass}>Occupation *</label>
        <OptionButton
          name="occupation"
          options={OCCUPATION_OPTIONS}
          value={form.occupation}
          onChange={handleField}
        />
      </div>

      {/* Gender */}
      <div>
        <label className={labelClass}>Your Gender *</label>
        <OptionButton
          name="gender"
          options={GENDER_OPTIONS}
          value={form.gender}
          onChange={handleField}
        />
      </div>

      {/* Gender Preference */}
      <div>
        <label className={labelClass}>Preferred Roommate Gender</label>
        <OptionButton
          name="genderPreference"
          options={GENDER_PREF_OPTIONS}
          value={form.genderPreference}
          onChange={handleField}
        />
      </div>

      {/* Cleanliness (1-5 slider) */}
      <div>
        <label className={labelClass}>Cleanliness Level * ({form.cleanliness}/5)</label>
        <input
          type="range"
          min={1} max={5} step={1}
          value={form.cleanliness}
          onChange={e => handleField('cleanliness', parseInt(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>Relaxed</span><span>Average</span><span>Very Clean</span>
        </div>
      </div>

      {/* Smoker toggle */}
      <label className="flex items-center gap-3 p-3 bg-background rounded-input border border-border
                         cursor-pointer select-none hover:border-primary transition-colors">
        <input
          type="checkbox"
          checked={form.smoker}
          onChange={e => handleField('smoker', e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        <span className="text-sm text-primary">I smoke / smoking is OK</span>
      </label>

      {/* Pets toggle */}
      <label className="flex items-center gap-3 p-3 bg-background rounded-input border border-border
                         cursor-pointer select-none hover:border-primary transition-colors">
        <input
          type="checkbox"
          checked={form.pets}
          onChange={e => handleField('pets', e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        <span className="text-sm text-primary">I have pets / pets are OK</span>
      </label>

      {/* Budget */}
      <div>
        <label className={labelClass} htmlFor="pf-budget">Monthly Budget (PKR)</label>
        <input
          id="pf-budget"
          type="number"
          min={1000}
          placeholder="e.g. 15000"
          value={form.budget}
          onChange={e => handleField('budget', e.target.value)}
          className="input"
        />
      </div>

      {/* City */}
      <div>
        <label className={labelClass} htmlFor="pf-city">Preferred City</label>
        <select
          id="pf-city"
          value={form.preferredCity}
          onChange={e => handleField('preferredCity', e.target.value)}
          className="input"
        >
          <option value="">Any city</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bio */}
      {!compact && (
        <div>
          <label className={labelClass} htmlFor="pf-bio">About Me</label>
          <textarea
            id="pf-bio"
            value={form.bio}
            onChange={e => handleField('bio', e.target.value)}
            rows={3}
            placeholder="Tell potential roommates about yourself…"
            className="input resize-none"
            maxLength={300}
          />
          <p className="text-xs text-text-secondary text-right mt-0.5">{form.bio.length}/300</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className={`w-full flex items-center justify-center gap-2 btn-primary
                    ${success ? 'bg-success hover:bg-success/90 border-success' : ''}`}
      >
        {saving ? (
          <><RiLoader4Line className="animate-spin" /> Saving…</>
        ) : success ? (
          <><RiCheckLine /> Preferences Saved!</>
        ) : (
          <><RiSaveLine /> {initialValues ? 'Update Preferences' : 'Save Preferences'}</>
        )}
      </button>
    </form>
  );
};

export default PreferenceForm;

import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import listingService from '../../services/listingService';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine, RiImageAddLine, RiCloseLine,
  RiCheckboxCircleLine, RiLoader4Line, RiHome4Line,
} from 'react-icons/ri';
import { CITIES, AMENITIES } from '../../utils/constants';

document.title = 'Edit Listing — RoomBridge';

/*
  BUG FIX: Values must match Listing.model.js enum: 'single' | 'shared' | 'apartment'
*/
const ROOM_TYPES = [
  { value: 'single',    label: 'Single Room'    },
  { value: 'shared',    label: 'Shared Room'    },
  { value: 'apartment', label: 'Full Apartment' },
];

const EditListing = () => {
  const { id }   = useParams();
  const navigate  = useNavigate();
  const fileRef   = useRef();

  const [form,      setForm]      = useState(null);
  const [newPhotos, setNewPhotos] = useState([]);
  const [previews,  setPreviews]  = useState([]);
  const [toRemove,  setToRemove]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});

  useEffect(() => {
    listingService.getListingById(id)
      .then(res => {
        /*
          Backend returns { success, listing } — res.listing is the correct path.
          Fallback to res.data for robustness.
        */
        const l = res.data?.listing || res.listing || res.data;
        if (!l) throw new Error('Listing not found');
        setForm({
          title:            l.title            || '',
          description:      l.description      || '',
          rent:             l.rent             || '',
          city:             l.city             || '',
          address:          l.address          || '',
          area:             l.area             || '',
          roomType:         l.roomType         || '',
          genderPreference: l.genderPreference || 'any',
          availableFrom:    l.availableFrom ? l.availableFrom.split('T')[0] : '',
          furnished:        l.furnished        || false,
          amenities:        Array.isArray(l.amenities) ? l.amenities : [],
          existingPhotos:   Array.isArray(l.photos) ? l.photos : [],
        });
      })
      .catch(() => {
        toast.error('Listing not found.');
        navigate('/owner/listings');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const handleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a],
    }));
  };

  const handleNewPhotos = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 6 - (form.existingPhotos.length - toRemove.length) - newPhotos.length;
    const toAdd = files.slice(0, Math.max(0, remaining));
    if (files.length > remaining) toast.error(`Max 6 photos total. Adding ${toAdd.length} only.`);
    setNewPhotos(p => [...p, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(p => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeExisting = (publicId) => {
    setToRemove(r => [...r, publicId]);
    setForm(f => ({
      ...f,
      existingPhotos: f.existingPhotos.filter(p => p.public_id !== publicId),
    }));
  };

  const removeNew = (i) => {
    setNewPhotos(p  => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const e = {};
    if (!form.title || form.title.length < 10)        e.title       = 'Title must be at least 10 characters';
    if (!form.description || form.description.length < 50) e.description = 'Description must be at least 50 characters';
    if (!form.rent || Number(form.rent) < 1000)       e.rent        = 'Rent must be at least PKR 1,000';
    if (!form.city)                                    e.city        = 'City is required';
    if (!form.address)                                 e.address     = 'Address is required';
    if (!form.roomType)                                e.roomType    = 'Room type is required';
    const totalPhotos = form.existingPhotos.length + newPhotos.length;
    if (totalPhotos === 0)                             e.photos      = 'At least one photo is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors below.'); return; }
    try {
      setSaving(true);
      const fd = new FormData();

      /* Scalar fields */
      ['title','description','rent','city','address','area','roomType','genderPreference','availableFrom'].forEach(k => {
        if (form[k] !== undefined && form[k] !== '') fd.append(k, form[k]);
      });
      fd.append('furnished', form.furnished);

      /*
        BUG FIX: amenities must be individual string appends (same as CreateListing).
        Old code didn't include amenities in EditListing at all.
      */
      (form.amenities || []).forEach(a => fd.append('amenities', a));

      if (toRemove.length) fd.append('removePhotos', JSON.stringify(toRemove));
      newPhotos.forEach(f => fd.append('photos', f));

      await listingService.updateListing(id, fd);
      toast.success('Listing updated! Re-submitted for review.');
      navigate('/owner/listings');
    } catch (err) {
      /* BUG FIX: err.message undefined on axios error */
      toast.error(err.response?.data?.message || 'Failed to update listing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <RiLoader4Line className="animate-spin text-4xl text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/owner/listings"
              className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors">
          <RiArrowLeftLine className="text-xl" />
        </Link>
        <div>
          <h1 className="font-bold text-primary">Edit Listing</h1>
          <p className="text-text-secondary text-xs">Update your listing details</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          {/* Photos */}
          <div className="bg-white rounded-card border border-border shadow-card p-6">
            <h2 className="font-semibold text-primary mb-1 flex items-center gap-2">
              <RiImageAddLine className="text-secondary" /> Photos
            </h2>
            <p className="text-xs text-text-secondary mb-4">Max 6 photos total. Click × to remove.</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
              {/* Existing photos */}
              {form.existingPhotos.map((p, i) => (
                <div key={p.public_id || i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExisting(p.public_id)}
                          aria-label="Remove photo"
                          className="absolute top-1 right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center">
                    <RiCloseLine className="text-white text-xs" />
                  </button>
                  {i === 0 && form.existingPhotos.length > 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-primary text-white px-1 rounded">Cover</span>
                  )}
                </div>
              ))}
              {/* New photo previews */}
              {previews.map((src, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-secondary/30">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNew(i)}
                          aria-label="Remove new photo"
                          className="absolute top-1 right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center">
                    <RiCloseLine className="text-white text-xs" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[9px] bg-secondary text-white px-1 rounded">New</span>
                </div>
              ))}
              {/* Add button */}
              {(form.existingPhotos.length + newPhotos.length) < 6 && (
                <button type="button" onClick={() => fileRef.current.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-border
                                   flex flex-col items-center justify-center text-text-secondary
                                   hover:border-secondary hover:text-secondary transition-colors">
                  <RiImageAddLine className="text-xl mb-1" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleNewPhotos} />
            {errors.photos && <p className="text-xs text-error">{errors.photos}</p>}
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-card border border-border shadow-card p-6 space-y-4">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <RiHome4Line className="text-secondary" /> Basic Information
            </h2>
            <div>
              <label className="label">Listing Title *</label>
              <input name="title" value={form.title} onChange={handleChange}
                     className={`input ${errors.title ? 'input-error' : ''}`} />
              {errors.title && <p className="error-msg">{errors.title}</p>}
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                        rows={5} className={`input resize-none ${errors.description ? 'input-error' : ''}`} />
              {errors.description && <p className="error-msg">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Room Type *</label>
                {/* BUG FIX: Values now match backend enum */}
                <select name="roomType" value={form.roomType} onChange={handleChange}
                        className={`input ${errors.roomType ? 'input-error' : ''}`}>
                  <option value="">Select type</option>
                  {ROOM_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.roomType && <p className="error-msg">{errors.roomType}</p>}
              </div>
              <div>
                <label className="label">Gender Preference</label>
                <select name="genderPreference" value={form.genderPreference}
                        onChange={handleChange} className="input">
                  <option value="any">Any</option>
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 bg-background rounded-input border border-border cursor-pointer select-none">
              <input type="checkbox" name="furnished" checked={form.furnished} onChange={handleChange}
                     className="accent-primary w-4 h-4" />
              <span className="text-sm text-primary">Furnished room</span>
            </label>
          </div>

          <div className="bg-white rounded-card border border-border shadow-card p-6 space-y-4">
            <h2 className="font-semibold text-primary">Pricing & Availability</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Rent (PKR) *</label>
                <input name="rent" type="number" min="1000" value={form.rent} onChange={handleChange}
                       className={`input ${errors.rent ? 'input-error' : ''}`} />
                {errors.rent && <p className="error-msg">{errors.rent}</p>}
              </div>
              <div>
                <label className="label">Available From</label>
                <input name="availableFrom" type="date"
                       min={new Date().toISOString().split('T')[0]}
                       value={form.availableFrom} onChange={handleChange} className="input" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card border border-border shadow-card p-6 space-y-4">
            <h2 className="font-semibold text-primary">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City *</label>
                <select name="city" value={form.city} onChange={handleChange}
                        className={`input ${errors.city ? 'input-error' : ''}`}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p className="error-msg">{errors.city}</p>}
              </div>
              <div>
                <label className="label">Area</label>
                <input name="area" value={form.area} onChange={handleChange} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Full Address *</label>
              <input name="address" value={form.address} onChange={handleChange}
                     className={`input ${errors.address ? 'input-error' : ''}`} />
              {errors.address && <p className="error-msg">{errors.address}</p>}
            </div>
          </div>

          {/* Amenities — was missing entirely from EditListing */}
          <div className="bg-white rounded-card border border-border shadow-card p-6">
            <h2 className="font-semibold text-primary mb-4">Amenities & Features</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map(a => (
                <label key={a}
                       className={`flex items-center gap-2 p-3 rounded-input border cursor-pointer
                                   transition-all duration-150 text-sm select-none
                                   ${form.amenities.includes(a)
                                     ? 'border-secondary bg-secondary/5 text-secondary font-medium'
                                     : 'border-border text-text-secondary hover:border-border/80'}`}>
                  <input type="checkbox" checked={form.amenities.includes(a)}
                         onChange={() => handleAmenity(a)}
                         className="accent-secondary shrink-0" />
                  {a}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/owner/listings" className="btn-secondary flex-1 justify-center">Cancel</Link>
            <button type="submit" disabled={saving}
                    className="btn-primary flex-1 justify-center gap-2">
              {saving ? <><RiLoader4Line className="animate-spin" /> Saving…</> : <><RiCheckboxCircleLine /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListing;

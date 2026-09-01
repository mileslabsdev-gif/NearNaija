import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { AccountType } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Camera, Loader2 } from 'lucide-react';

export function CompleteProfile({
  onDone,
}: {
  onDone: () => void;
}) {
  const { completeProfile, user } = useAuth();
  const { location, loading: geoLoading, detect } = useGeolocation();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');
  const [accountType, setAccountType] = useState<AccountType>('Buyer');
  const [community, setCommunity] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePhoto = (file: File | null) => {
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim() || !community.trim()) return;
    setSaving(true);
    try {
      await completeProfile({
        displayName: displayName.trim(),
        photoFile,
        accountType,
        community: community.trim(),
        lat: location?.lat,
        lng: location?.lng,
      });
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-gray-50 overflow-y-auto animate-fade-in">
      <div className="max-w-lg mx-auto p-5 pt-10 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-primary">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Let your community know who you are</p>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <label className="relative cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera size={28} />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            <span className="text-xs text-gray-400">Tap to add photo</span>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Display Name</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Chidi Okafor"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Account Type</label>
            <select
              className="input"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
            >
              <option>Buyer</option>
              <option>Seller</option>
              <option>Agent</option>
              <option>Car Dealer</option>
              <option>Business</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Community / Area</label>
            <input
              className="input"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              placeholder="e.g. Lekki Phase 1, Lagos"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Your Location</label>
            {geoLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin" /> Detecting location...
              </div>
            ) : location ? (
              <div className="flex items-center gap-2 text-sm text-brand-primary font-medium">
                <MapPin size={16} /> Detected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
            ) : (
              <button type="button" onClick={detect} className="btn-outline text-sm px-4 py-2">
                <MapPin size={16} className="inline mr-1" /> Detect My Location
              </button>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !displayName.trim() || !community.trim()}
            className="btn-primary w-full disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Complete Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

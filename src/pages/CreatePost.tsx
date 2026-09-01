import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/useToast';
import { ImageUpload } from '@/components/ImageUpload';
import { ToastView } from '@/components/Toast';
import type { PostCategory, NegotiationType, PropertySubType } from '@/types';
import { MapPin, Loader2, ChevronLeft } from 'lucide-react';

export function CreatePost() {
  const { profile, user } = useAuth();
  const { location, loading: geoLoading, detect } = useGeolocation();
  const { toast, show } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostCategory>('Product');
  const [subType, setSubType] = useState<PropertySubType>(undefined);
  const [price, setPrice] = useState<string>('');
  const [contactForPrice, setContactForPrice] = useState(false);
  const [negotiation, setNegotiation] = useState<NegotiationType>('Negotiable');
  const [agentFeeMin, setAgentFeeMin] = useState<string>('5');
  const [agentFeeMax, setAgentFeeMax] = useState<string>('10');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [community, setCommunity] = useState(profile?.community || '');
  const [targetCity, setTargetCity] = useState('');
  const [saving, setSaving] = useState(false);

  const isAgentType =
    profile?.accountType === 'Agent' || profile?.accountType === 'Car Dealer' || profile?.accountType === 'Business';

  const showSubType = category === 'Property' || category === 'Vehicle';
  const showTargetCity = category === 'Property' || category === 'Vehicle';

  const handleFiles = (urls: string[]) => {
    setImages(urls);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !community.trim()) {
      show('Please fill in all required fields', 'error');
      return;
    }
    if (images.length === 0) {
      show('Please add at least one photo', 'error');
      return;
    }
    if (!user) return;
    setSaving(true);

    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${i}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const postData = {
        ownerId: user.uid,
        ownerName: profile?.displayName || '',
        ownerPhotoURL: profile?.photoURL || '',
        title: title.trim(),
        description: description.trim(),
        category,
        subType: showSubType ? subType : null,
        price: contactForPrice ? null : price ? Number(price) : null,
        contactForPrice,
        negotiation,
        agentFeeMin: negotiation === 'Agent Fee' ? Number(agentFeeMin) : null,
        agentFeeMax: negotiation === 'Agent Fee' ? Number(agentFeeMax) : null,
        images: imageUrls,
        location: location ? { lat: location.lat, lng: location.lng } : null,
        community: community.trim(),
        targetCity: showTargetCity ? targetCity.trim() : null,
        status: 'Active',
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'posts'), postData);
      show('Your post is live! You can fully edit it within the first 48 hours only.', 'success');
      setTimeout(() => navigate('/'), 1500);
    } catch {
      show('Failed to create post. Check your Firebase config.', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3 md:hidden">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Create Post</h1>
      </div>
      <h1 className="text-2xl font-bold hidden md:block">Create Post</h1>

      <div className="card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Photos</label>
          <ImageUpload
            images={images}
            onChange={(urls) => {
              setImages(urls);
              setImageFiles((prev) => {
                const files = [...prev];
                if (urls.length > files.length) {
                  return files;
                }
                return files.filter((_, i) => i < urls.length);
              });
            }}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Title *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tokunbo Toyota Corolla 2018" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Description *</label>
          <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you're offering..." />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Category *</label>
          <select
            className="input"
            value={category}
            onChange={(e) => {
              const cat = e.target.value as PostCategory;
              setCategory(cat);
              setSubType(undefined);
            }}
          >
            <option value="Product">Product</option>
            <option value="Service">Service</option>
            <option value="Property">Property</option>
            <option value="Vehicle">Vehicle</option>
          </select>
        </div>

        {showSubType && (
          <div>
            <label className="text-sm font-medium block mb-1">Sub-type</label>
            <select className="input" value={subType || ''} onChange={(e) => setSubType(e.target.value as PropertySubType)}>
              {category === 'Property' ? (
                <>
                  <option value="">General Property</option>
                  <option value="House for Rent">House for Rent</option>
                  <option value="Room to Let">Room to Let</option>
                </>
              ) : (
                <>
                  <option value="">General Vehicle</option>
                  <option value="Cars">Cars</option>
                </>
              )}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium block mb-2">Pricing</label>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={contactForPrice}
              onChange={(e) => setContactForPrice(e.target.checked)}
              className="w-5 h-5 accent-brand-primary"
            />
            <span className="text-sm font-medium">Contact for Price</span>
          </div>
          {!contactForPrice && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₦</span>
              <input
                type="number"
                className="input pl-8"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Negotiation *</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors" style={{ borderColor: negotiation === 'Negotiable' ? '#008C4A' : '#e5e7eb' }}>
              <input type="radio" name="neg" checked={negotiation === 'Negotiable'} onChange={() => setNegotiation('Negotiable')} className="accent-brand-primary" />
              <span className="text-sm">🟢 Price Negotiable</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors" style={{ borderColor: negotiation === 'Fixed Price' ? '#008C4A' : '#e5e7eb' }}>
              <input type="radio" name="neg" checked={negotiation === 'Fixed Price'} onChange={() => setNegotiation('Fixed Price')} className="accent-brand-primary" />
              <span className="text-sm">🔴 Fixed Price</span>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${isAgentType ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`} style={{ borderColor: negotiation === 'Agent Fee' ? '#008C4A' : '#e5e7eb' }}>
              <input type="radio" name="neg" checked={negotiation === 'Agent Fee'} onChange={() => isAgentType && setNegotiation('Agent Fee')} disabled={!isAgentType} className="accent-brand-primary" />
              <span className="text-sm">🤝 Agent Fee Negotiable {!isAgentType && '(Agent/Dealer/Business only)'}</span>
            </label>
            {negotiation === 'Agent Fee' && isAgentType && (
              <div className="flex items-center gap-2 pl-8">
                <input type="number" className="input w-20" value={agentFeeMin} onChange={(e) => setAgentFeeMin(e.target.value)} />
                <span className="text-gray-500">to</span>
                <input type="number" className="input w-20" value={agentFeeMax} onChange={(e) => setAgentFeeMax(e.target.value)} />
                <span className="text-gray-500">%</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Location / Community *</label>
          <input className="input" value={community} onChange={(e) => setCommunity(e.target.value)} placeholder="e.g. Yaba, Lagos" />
          {geoLoading ? (
            <p className="text-xs text-gray-400 mt-1">Detecting location...</p>
          ) : location ? (
            <p className="text-xs text-brand-primary mt-1">GPS detected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
          ) : (
            <button type="button" onClick={detect} className="text-xs text-brand-primary mt-1 flex items-center gap-1">
              <MapPin size={12} /> Detect my location
            </button>
          )}
        </div>

        {showTargetCity && (
          <div>
            <label className="text-sm font-medium block mb-1">Target City/State</label>
            <input className="input" value={targetCity} onChange={(e) => setTargetCity(e.target.value)} placeholder="e.g. Abuja, FCT" />
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full disabled:opacity-40">
          {saving ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Publish Post'}
        </button>
      </div>
      <ToastView toast={toast} />
    </div>
  );
}

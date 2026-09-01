import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { PostCard } from '@/components/PostCard';
import { RadiusSlider } from '@/components/RadiusSlider';
import { Search as SearchIcon, SearchX } from 'lucide-react';
import { haversineKm } from '@/lib/utils';
import type { Post, PropertySubType } from '@/types';

type CatFilter = 'All' | 'Products' | 'Services' | 'Property' | 'Vehicles' | 'House for Rent' | 'Room to Let' | 'Cars';
type PriceFilter = 'Any' | 'Negotiable' | 'Fixed Price';

export function Search() {
  const { profile } = useAuth();
  const { location } = useGeolocation();
  const [keyword, setKeyword] = useState('');
  const [radius, setRadius] = useState(10);
  const [catFilter, setCatFilter] = useState<CatFilter>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('Any');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const userLat = profile?.location?.lat ?? location?.lat;
  const userLng = profile?.location?.lng ?? location?.lng;

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = posts.filter((p) => {
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      if (!p.title.toLowerCase().includes(kw) && !p.description.toLowerCase().includes(kw)) {
        return false;
      }
    }
    if (catFilter !== 'All') {
      if (catFilter === 'Products' && p.category !== 'Product') return false;
      if (catFilter === 'Services' && p.category !== 'Service') return false;
      if (catFilter === 'Property' && p.category !== 'Property') return false;
      if (catFilter === 'Vehicles' && p.category !== 'Vehicle') return false;
      if (catFilter === 'House for Rent' && p.subType !== 'House for Rent') return false;
      if (catFilter === 'Room to Let' && p.subType !== 'Room to Let') return false;
      if (catFilter === 'Cars' && p.subType !== 'Cars') return false;
    }
    if (priceFilter === 'Negotiable' && p.negotiation !== 'Negotiable') return false;
    if (priceFilter === 'Fixed Price' && p.negotiation !== 'Fixed Price') return false;
    if (p.location && userLat != null && userLng != null) {
      const dist = haversineKm(userLat, userLng, p.location.lat, p.location.lng);
      if (dist > radius) return false;
    } else {
      return false;
    }
    return true;
  });

  const catOptions: CatFilter[] = ['All', 'Products', 'Services', 'Property', 'Vehicles', 'House for Rent', 'Room to Let', 'Cars'];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>

      <div className="card p-4 space-y-4">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-11"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search for anything..."
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Search Radius</label>
          <RadiusSlider value={radius} onChange={setRadius} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Category</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {catOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  catFilter === cat
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Price Type</label>
          <div className="flex gap-2">
            {(['Any', 'Negotiable', 'Fixed Price'] as PriceFilter[]).map((pf) => (
              <button
                key={pf}
                onClick={() => setPriceFilter(pf)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  priceFilter === pf
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto flex items-center justify-center">
            <SearchX size={36} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No results found</h3>
            <p className="text-gray-500 text-sm mt-1">
              Try widening your search radius or changing your filters. Your perfect fit might be just a few kilometers away!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} userLat={userLat} userLng={userLng} />
          ))}
        </div>
      )}
    </div>
  );
}

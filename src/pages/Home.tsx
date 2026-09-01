import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { PostCard } from '@/components/PostCard';
import { RadiusSlider } from '@/components/RadiusSlider';
import { Plus, PackageSearch } from 'lucide-react';
import { haversineKm } from '@/lib/utils';
import type { Post } from '@/types';

export function Home() {
  const { profile } = useAuth();
  const { location, loading: geoLoading } = useGeolocation();
  const navigate = useNavigate();
  const [radius, setRadius] = useState(10);
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
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
      setPosts(all);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = posts.filter((p) => {
    if (!p.location || userLat == null || userLng == null) return false;
    const dist = haversineKm(userLat, userLng, p.location.lat, p.location.lng);
    return dist <= radius;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Near You</h1>
          <p className="text-sm text-gray-500">
            {profile?.community ? `Around ${profile.community}` : 'Finding listings near you...'}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <label className="text-sm font-medium block mb-2">Search Radius</label>
        <RadiusSlider value={radius} onChange={setRadius} />
      </div>

      {loading || geoLoading ? (
        <div className="text-center py-16 text-gray-400">
          <PackageSearch size={48} className="mx-auto mb-3" />
          <p>Loading listings near you...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 rounded-full bg-brand-primary/10 mx-auto flex items-center justify-center">
            <PackageSearch size={36} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No listings near you yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Nothin' dey your area yet! Be the first to post something for your community.
            </p>
          </div>
          <button onClick={() => navigate('/post')} className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} /> Post Something
          </button>
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

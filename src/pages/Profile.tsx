import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { ToastView } from '@/components/Toast';
import { PostCard } from '@/components/PostCard';
import { StatusBadge } from '@/components/Badges';
import {
  ChevronLeft,
  MessageCircle,
  Flag,
  Edit,
  Camera,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';
import type { UserProfile, Post, Report, AccountType } from '@/types';

export function MyProfile() {
  const { profile, user, updateMyProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, show } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [accountType, setAccountType] = useState<AccountType>(profile?.accountType || 'Buyer');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.photoURL || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'posts'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
    });
    return unsub;
  }, [user]);

  if (!profile || !user) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  const handlePhoto = (file: File | null) => {
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile({
        displayName: displayName.trim(),
        accountType,
        photoFile,
      });
      show('Profile updated!', 'success');
      setEditing(false);
      setPhotoFile(null);
    } catch {
      show('Failed to update profile', 'error');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="card p-5">
        <div className="flex items-center gap-4">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <Camera size={28} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profile.displayName}</h1>
            <p className="text-sm text-brand-primary font-medium">{profile.accountType}</p>
            <p className="text-sm text-gray-400">{profile.community}</p>
          </div>
          <button onClick={() => setEditing(true)} className="btn-outline px-3 py-2 text-sm">
            <Edit size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <Link to="/chat" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            <MessageCircle size={18} /> My Chats
          </Link>
          <button onClick={handleLogout} className="btn-outline px-4 text-sm">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-3">My Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-gray-500">You haven't posted anything yet.</p>
            <button onClick={() => navigate('/post')} className="btn-primary">Post Something</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {posts.map((p) => (
              <div key={p.id} className="relative">
                <PostCard post={p} />
                <div className="absolute top-2 right-2 z-10">
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Edit Profile</h2>
              <button onClick={() => setEditing(false)}><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center">
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
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Display Name</label>
              <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Account Type</label>
              <select className="input" value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
                <option>Buyer</option>
                <option>Seller</option>
                <option>Agent</option>
                <option>Car Dealer</option>
                <option>Business</option>
              </select>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full disabled:opacity-40">
              {saving ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <ToastView toast={toast} />
    </div>
  );
}

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [reportCategory, setReportCategory] = useState('Fraud');
  const { toast, show } = useToast();

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'users', id)).then((snap) => {
      if (snap.exists()) setOtherProfile(snap.data() as UserProfile);
    });
    const q = query(
      collection(db, 'posts'),
      where('ownerId', '==', id),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
    });
    return unsub;
  }, [id]);

  if (!otherProfile) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  const handleReport = async () => {
    if (!user || !id) return;
    const report: Omit<Report, 'id'> = {
      reporterId: user.uid,
      targetType: 'account',
      targetId: id,
      category: reportCategory,
      createdAt: Date.now(),
    };
    await addDoc(collection(db, 'reports'), report);
    show('Report submitted. Thank you.', 'success');
    setShowReport(false);
  };

  const startChat = () => {
    if (posts.length > 0) {
      navigate(`/chat/new/${posts[0].id}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)}>
        <ChevronLeft size={24} />
      </button>

      <div className="card p-5">
        <div className="flex items-center gap-4">
          {otherProfile.photoURL ? (
            <img src={otherProfile.photoURL} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200" />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{otherProfile.displayName}</h1>
            <p className="text-sm text-brand-primary font-medium">{otherProfile.accountType}</p>
            <p className="text-sm text-gray-400">{otherProfile.community}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={startChat} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            <MessageCircle size={18} /> Message
          </button>
          <button onClick={() => setShowReport(true)} className="btn-outline px-4 text-red-600 border-red-600 hover:bg-red-600">
            <Flag size={18} />
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-3">Active Posts</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No active posts from this user.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>

      {showReport && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Report this Account</h2>
              <button onClick={() => setShowReport(false)}><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {['Fraud', 'Fake Listing', 'Harassment', 'Other'].map((cat) => (
                <label key={cat} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer" style={{ borderColor: reportCategory === cat ? '#008C4A' : '#e5e7eb' }}>
                  <input type="radio" name="report" checked={reportCategory === cat} onChange={() => setReportCategory(cat)} className="accent-brand-primary" />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
            <button onClick={handleReport} className="btn-primary w-full">Submit Report</button>
          </div>
        </div>
      )}

      <ToastView toast={toast} />
    </div>
  );
}

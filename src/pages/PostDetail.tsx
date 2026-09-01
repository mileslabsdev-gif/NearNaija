import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/useToast';
import { ToastView } from '@/components/Toast';
import { NegotiationBadge, CategoryBadge, StatusBadge } from '@/components/Badges';
import {
  formatPrice,
  formatDistance,
  haversineKm,
  timeAgo,
  containsUrl,
} from '@/lib/utils';
import type { Post, Comment, Report } from '@/types';
import {
  ChevronLeft,
  MapPin,
  MessageCircle,
  Share2,
  Flag,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Shield,
  X,
  Link2,
} from 'lucide-react';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { location } = useGeolocation();
  const { toast, show } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentWarning, setCommentWarning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportCategory, setReportCategory] = useState('Fraud');
  const [showShare, setShowShare] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const userLat = profile?.location?.lat ?? location?.lat;
  const userLng = profile?.location?.lng ?? location?.lng;

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'posts', id), (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() } as Post);
      } else {
        setPost(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, 'posts', id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment));
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-gray-500">This post no longer exists.</p>
        <Link to="/" className="btn-primary inline-block">Back to Home</Link>
      </div>
    );
  }

  const isOwner = user?.uid === post.ownerId;
  const distance =
    userLat != null && userLng != null && post.location
      ? haversineKm(userLat, userLng, post.location.lat, post.location.lng)
      : null;
  const canEdit = isOwner && Date.now() - post.createdAt < 48 * 60 * 60 * 1000;

  const handleComment = async () => {
    if (!newComment.trim() || !user || !id) return;
    if (containsUrl(newComment)) {
      setCommentWarning(true);
      return;
    }
    await addDoc(collection(db, 'posts', id, 'comments'), {
      authorId: user.uid,
      authorName: profile?.displayName || '',
      authorPhoto: profile?.photoURL || '',
      text: newComment.trim(),
      createdAt: Date.now(),
    });
    setNewComment('');
    setCommentWarning(false);
  };

  const handleReport = async () => {
    if (!user || !id) return;
    const report: Omit<Report, 'id'> = {
      reporterId: user.uid,
      targetType: 'post',
      targetId: id,
      category: reportCategory,
      createdAt: Date.now(),
    };
    await addDoc(collection(db, 'reports'), report);
    show('Report submitted. Thank you for keeping NearNaija safe.', 'success');
    setShowReport(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteDoc(doc(db, 'posts', id));
    navigate('/');
  };

  const handleStatusChange = async (status: 'Active' | 'Sold' | 'Rented' | 'Unavailable') => {
    if (!id) return;
    await updateDoc(doc(db, 'posts', id), { status });
    show(`Marked as ${status}`, 'success');
    setMenuOpen(false);
  };

  const startChat = () => {
    if (!user || !profile) return;
    navigate(`/chat/new/${post.id}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    show('Link copied!', 'success');
  };

  const shareWhatsApp = () => {
    const text = `Check out "${post.title}" on NearNaija: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
              <MoreVertical size={22} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48 z-50 animate-scale-in">
                {canEdit && (
                  <button onClick={() => navigate(`/post/${post.id}/edit`)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                    <Edit size={16} /> Edit
                  </button>
                )}
                <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-red-600">
                  <Trash2 size={16} /> Delete
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => handleStatusChange('Sold')} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                  <CheckCircle size={16} /> Mark as Sold
                </button>
                <button onClick={() => handleStatusChange('Rented')} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                  <CheckCircle size={16} /> Mark as Rented
                </button>
                <button onClick={() => handleStatusChange('Unavailable')} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                  <CheckCircle size={16} /> Mark Unavailable
                </button>
                {post.status !== 'Active' && (
                  <button onClick={() => handleStatusChange('Active')} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-brand-primary">
                    <CheckCircle size={16} /> Set as Active
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Gallery */}
      <div className="rounded-2xl overflow-hidden bg-gray-100">
        <div className="aspect-[4/3] w-full">
          {post.images[activeImage] ? (
            <img src={post.images[activeImage]} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <MapPin size={48} />
            </div>
          )}
        </div>
        {post.images.length > 1 && (
          <div className="flex gap-1 p-2 overflow-x-auto no-scrollbar">
            {post.images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 ${idx === activeImage ? 'border-brand-primary' : 'border-transparent'}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={post.category} subType={post.subType} />
          {post.status !== 'Active' && <StatusBadge status={post.status} />}
        </div>
        <h1 className="text-xl font-bold">{post.title}</h1>
        <p className="text-2xl font-bold text-brand-primary">
          {formatPrice(post.price, post.contactForPrice)}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <NegotiationBadge type={post.negotiation} agentFeeMin={post.agentFeeMin} agentFeeMax={post.agentFeeMax} />
          {distance != null && (
            <span className="badge bg-gray-100 text-gray-600">
              <MapPin size={11} /> {formatDistance(distance)}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{post.description}</p>
        {post.targetCity && (
          <p className="text-sm text-gray-500">
            <span className="font-medium">Target City/State:</span> {post.targetCity}
          </p>
        )}
        <p className="text-xs text-gray-400">Posted {timeAgo(post.createdAt)}</p>
      </div>

      {/* Safety Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
        <Shield size={18} className="text-orange-600 shrink-0" />
        <p className="text-sm text-orange-700">Stay safe. Verify before you pay. Meet in public places.</p>
      </div>

      {/* Seller info */}
      <div className="card p-4 flex items-center gap-3">
        <Link to={`/user/${post.ownerId}`}>
          {post.ownerPhotoURL ? (
            <img src={post.ownerPhotoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200" />
          )}
        </Link>
        <div className="flex-1">
          <Link to={`/user/${post.ownerId}`} className="font-semibold text-sm hover:underline">
            {post.ownerName}
          </Link>
          <p className="text-xs text-gray-400">{post.community}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {!isOwner && (
          <button onClick={startChat} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <MessageCircle size={20} /> Message Seller
          </button>
        )}
        <button onClick={() => setShowShare(true)} className="btn-outline px-4">
          <Share2 size={20} />
        </button>
        {!isOwner && (
          <button onClick={() => setShowReport(true)} className="btn-outline px-4 text-red-600 border-red-600 hover:bg-red-600">
            <Flag size={20} />
          </button>
        )}
      </div>

      {/* Owner status buttons */}
      {isOwner && post.status === 'Active' && (
        <div className="flex gap-3">
          <button onClick={() => handleStatusChange('Sold')} className="btn-secondary flex-1">
            Mark as Sold
          </button>
          <button onClick={() => handleStatusChange('Rented')} className="btn-secondary flex-1">
            Mark as Rented
          </button>
        </div>
      )}

      {/* Comments */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-lg">Comments</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">No comments yet. Start the conversation!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                {c.authorPhoto ? (
                  <img src={c.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium">{c.authorName}</p>
                  <p className="text-sm text-gray-600">{c.text}</p>
                  <p className="text-xs text-gray-400">{timeAgo(c.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {commentWarning && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 flex items-center gap-1">
              <Link2 size={12} /> Links are not allowed in comments.
            </p>
          )}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setCommentWarning(false);
              }}
              placeholder="Add a comment..."
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <button onClick={handleComment} className="btn-primary px-4">
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <Modal onClose={() => setShowReport(false)} title="Report this Post">
          <div className="space-y-2">
            {['Fraud', 'Fake Listing', 'Wrong Item', 'Other'].map((cat) => (
              <label key={cat} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer" style={{ borderColor: reportCategory === cat ? '#008C4A' : '#e5e7eb' }}>
                <input type="radio" name="report" checked={reportCategory === cat} onChange={() => setReportCategory(cat)} className="accent-brand-primary" />
                <span className="text-sm">{cat}</span>
              </label>
            ))}
          </div>
          <button onClick={handleReport} className="btn-primary w-full mt-4">Submit Report</button>
        </Modal>
      )}

      {/* Share Modal */}
      {showShare && (
        <Modal onClose={() => setShowShare(false)} title="Share this Post">
          <div className="space-y-2">
            <button onClick={shareWhatsApp} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-brand-primary transition-colors">
              <span className="text-2xl">💬</span> Share on WhatsApp
            </button>
            <button onClick={copyLink} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-brand-primary transition-colors">
              <Link2 size={20} /> Copy Link
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <Modal onClose={() => setShowDelete(false)} title="Delete Post?">
          <p className="text-sm text-gray-600">Are you sure you want to delete this post? This cannot be undone.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowDelete(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl">Delete</button>
          </div>
        </Modal>
      )}

      <ToastView toast={toast} />
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

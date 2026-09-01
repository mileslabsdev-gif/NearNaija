import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { NegotiationBadge } from '@/components/Badges';
import {
  ChevronLeft,
  Send,
  Shield,
  MessageCircle,
} from 'lucide-react';
import type { ChatThread, ChatMessage, Post } from '@/types';
import { formatPrice, timeAgo } from '@/lib/utils';

export function ChatList() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatThread));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Chats</h1>
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-20 h-20 rounded-full bg-brand-primary/10 mx-auto flex items-center justify-center">
            <MessageCircle size={36} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No chats yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              When you message a seller, your conversations will show here. Start by browsing listings near you!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => {
            const otherName = t.buyerId === user?.uid ? t.sellerName : t.buyerName;
            const otherPhoto = t.buyerId === user?.uid ? t.sellerPhoto : t.buyerPhoto;
            return (
              <button
                key={t.id}
                onClick={() => navigate(`/chat/${t.id}`)}
                className="card p-3 flex items-center gap-3 w-full hover:shadow-md transition-shadow text-left"
              >
                {otherPhoto ? (
                  <img src={otherPhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{otherName}</p>
                    <span className="text-xs text-gray-400">{timeAgo(t.lastMessageAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{t.lastMessage}</p>
                  <p className="text-xs text-brand-primary truncate mt-0.5">{t.postTitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatConversation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    let setupComplete = false;

    const setupChat = async () => {
      const threadSnap = await getDoc(doc(db, 'chats', id));
      if (threadSnap.exists()) {
        setThread({ id: threadSnap.id, ...threadSnap.data() } as ChatThread);
        if (!threadSnap.data().safetyShown) {
          setShowSafety(true);
        }
        setLoading(false);
        setupComplete = true;
      }
    };
    setupChat();

    const q = query(
      collection(db, 'chats', id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage));
    });

    return () => {
      unsub();
    };
  }, [id]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading chat...</div>;
  }

  if (!thread || !user) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-gray-500">Chat not found.</p>
        <button onClick={() => navigate('/chat')} className="btn-primary">Back to Chats</button>
      </div>
    );
  }

  const isBuyer = thread.buyerId === user.uid;
  const otherName = isBuyer ? thread.sellerName : thread.buyerName;
  const otherPhoto = isBuyer ? thread.sellerPhoto : thread.buyerPhoto;

  const canOffer = thread.postNegotiation === 'Negotiable';
  const isFixed = thread.postNegotiation === 'Fixed Price';
  const isAgentFee = thread.postNegotiation === 'Agent Fee';

  const send = async () => {
    if (!newMsg.trim() || !id) return;
    const msg: Omit<ChatMessage, 'id'> = {
      senderId: user.uid,
      text: newMsg.trim(),
      createdAt: Date.now(),
    };
    await addDoc(collection(db, 'chats', id, 'messages'), msg);
    await updateDoc(doc(db, 'chats', id), {
      lastMessage: newMsg.trim(),
      lastMessageAt: Date.now(),
    });
    setNewMsg('');
  };

  const sendOffer = async () => {
    if (!offerAmount.trim() || !id) return;
    const msg: Omit<ChatMessage, 'id'> = {
      senderId: user.uid,
      text: `Offer: ₦${Number(offerAmount).toLocaleString('en-NG')}`,
      offerAmount: Number(offerAmount),
      createdAt: Date.now(),
    };
    await addDoc(collection(db, 'chats', id, 'messages'), msg);
    await updateDoc(doc(db, 'chats', id), {
      lastMessage: msg.text,
      lastMessageAt: Date.now(),
    });
    setOfferAmount('');
    setShowOffer(false);
  };

  const acceptSafety = async () => {
    setShowSafety(false);
    if (id) {
      await updateDoc(doc(db, 'chats', id), { safetyShown: true });
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/chat')}>
          <ChevronLeft size={24} />
        </button>
        {otherPhoto ? (
          <img src={otherPhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{otherName}</p>
          <p className="text-xs text-gray-400 truncate">{thread.postTitle}</p>
        </div>
        {isAgentFee && (
          <NegotiationBadge type="Agent Fee" agentFeeMin={thread.agentFeeMin} agentFeeMax={thread.agentFeeMax} />
        )}
      </div>

      {/* Price banner */}
      {isFixed && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2 text-sm text-red-700 text-center">
          Seller has set a fixed price. Please respect this.
        </div>
      )}
      {canOffer && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-2 text-sm text-green-700 text-center">
          Price is negotiable — you can make an offer.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((m) => {
          const mine = m.senderId === user.uid;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${mine ? 'bg-brand-primary text-white' : 'bg-white border border-gray-100'}`}>
                {m.offerAmount != null && (
                  <p className={`text-xs mb-0.5 ${mine ? 'text-green-100' : 'text-brand-primary'} font-semibold`}>
                    Offer
                  </p>
                )}
                <p className="text-sm">{m.text}</p>
                <p className={`text-xs mt-0.5 ${mine ? 'text-green-100' : 'text-gray-400'}`}>
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-3 space-y-2">
        {showOffer && canOffer && (
          <div className="flex gap-2 animate-slide-up">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₦</span>
              <input
                type="number"
                className="input pl-8"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Your offer"
                autoFocus
              />
            </div>
            <button onClick={sendOffer} className="btn-primary px-4">Send Offer</button>
            <button onClick={() => setShowOffer(false)} className="btn-outline px-3">Cancel</button>
          </div>
        )}
        <div className="flex items-center gap-2">
          {canOffer && !showOffer && (
            <button onClick={() => setShowOffer(true)} className="btn-accent px-3 py-3 text-sm whitespace-nowrap">
              Make Offer
            </button>
          )}
          <input
            className="input flex-1"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={send} className="btn-primary px-4 py-3">
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Safety popup */}
      {showSafety && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Shield size={22} className="text-orange-600" />
              </div>
              <h2 className="font-bold text-lg">Stay Safe</h2>
            </div>
            <p className="text-sm text-gray-600">
              NearNaija does not handle payments. Always verify before paying. Stay safe.
            </p>
            <button onClick={acceptSafety} className="btn-primary w-full">I Understand</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NewChat() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId || !user || !profile) return;

    const createThread = async () => {
      const postSnap = await getDoc(doc(db, 'posts', postId));
      if (!postSnap.exists()) {
        navigate('/');
        return;
      }
      const post = { id: postSnap.id, ...postSnap.data() } as Post;

      if (post.ownerId === user.uid) {
        navigate(`/post/${postId}`);
        return;
      }

      const chatId = `${user.uid}_${post.ownerId}_${postId}`;

      const existing = await getDoc(doc(db, 'chats', chatId));
      if (!existing.exists()) {
        const thread: Partial<ChatThread> = {
          postId: postId,
          postTitle: post.title,
          postImage: post.images[0] || '',
          postPrice: post.price,
          postNegotiation: post.negotiation,
          agentFeeMin: post.agentFeeMin,
          agentFeeMax: post.agentFeeMax,
          buyerId: user.uid,
          sellerId: post.ownerId,
          buyerName: profile.displayName,
          sellerName: post.ownerName,
          buyerPhoto: profile.photoURL,
          sellerPhoto: post.ownerPhotoURL,
          lastMessage: '',
          lastMessageAt: Date.now(),
          safetyShown: false,
          participants: [user.uid, post.ownerId],
        };
        await setDoc(doc(db, 'chats', chatId), thread);
      }
      navigate(`/chat/${chatId}`);
    };

    createThread().catch(() => {
      setLoading(false);
    });
  }, [postId, user, profile, navigate]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Starting chat...</div>;
  }
  return null;
}

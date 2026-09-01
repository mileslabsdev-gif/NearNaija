import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MessageCircle, User, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function TopNav() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 hidden md:block">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-xl font-bold text-brand-primary">NearNaija</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Home size={18} /> Home
          </Link>
          <Link to="/search" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Search size={18} /> Search
          </Link>
          <button onClick={() => navigate('/post')} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Plus size={18} /> Post
          </button>
          <Link to="/chat" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
            <MessageCircle size={18} /> Chat
          </Link>
          <Link to="/profile" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <User size={18} />
            )}
            <span>Profile</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

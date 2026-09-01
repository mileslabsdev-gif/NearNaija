import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/post', icon: Plus, label: 'Post', isPost: true },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          if (item.isPost) {
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-[10px] mt-0.5 text-brand-primary font-semibold">{item.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 ${
                active ? 'text-brand-primary' : 'text-gray-400'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

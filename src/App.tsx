import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { CreatePost } from '@/pages/CreatePost';
import { PostDetail } from '@/pages/PostDetail';
import { Search } from '@/pages/Search';
import { ChatList, ChatConversation, NewChat } from '@/pages/Chat';
import { MyProfile, UserProfile } from '@/pages/Profile';
import { SafetyAgreement } from '@/components/SafetyAgreement';
import { CompleteProfile } from '@/components/CompleteProfile';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && !profile.safetyAccepted) {
    return (
      <SafetyAgreement
        onAccept={async () => {
          try {
            await updateDoc(doc(db, 'users', user.uid), { safetyAccepted: true });
          } catch {
            // ignore Firestore errors
          }
        }}
      />
    );
  }

  if (profile && (!profile.displayName || !profile.community)) {
    return <CompleteProfile onDone={() => window.location.reload()} />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/post" element={<CreatePost />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:id" element={<ChatConversation />} />
        <Route path="/chat/new/:postId" element={<NewChat />} />
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/user/:id" element={<UserProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

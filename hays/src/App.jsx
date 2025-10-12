import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Feed from '@/pages/Feed';
import Profile from '@/pages/Profile';
import Search from '@/pages/Search';
import PostDetails from '@/pages/PostDetails';
import ProtectedRoute from '@/components/ProtectedRoute';
import NotFound from '@/pages/NotFound';
import PeoplePage from '@/pages/PeoplePage';
import ProfilePage from '@/pages/ProfilePage';
import Chat from '@/pages/Chat';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto p-4 flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Feed />} />
            <Route path="/user/:id" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/me" element={<ProfilePage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/posts/:id" element={<PostDetails />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

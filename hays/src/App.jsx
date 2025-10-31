import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/Navbar';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import EmailVerification from '@/pages/EmailVerification';
import Feed from '@/pages/Feed';
import Profile from '@/pages/Profile';
import Search from '@/pages/Search';
import PostDetails from '@/pages/PostDetails';
import ProtectedRoute from '@/components/ProtectedRoute';
import PeoplePage from '@/pages/PeoplePage';
import ProfilePage from '@/pages/ProfilePage';
import Chat from '@/pages/Chat';
import FriendsPage from '@/pages/FriendsPage';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto p-4 flex-1">
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerification />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Feed />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/user/:id" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/me" element={<ProfilePage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/posts/:id" element={<PostDetails />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/friends" element={<FriendsPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Bookmarks from './pages/Bookmarks';
import Trending from './pages/Trending';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:id?" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/create" element={
            <ProtectedRoute roles={['author', 'admin']}><CreatePost /></ProtectedRoute>
          } />
          <Route path="/edit/:id" element={
            <ProtectedRoute roles={['author', 'admin']}><EditPost /></ProtectedRoute>
          } />
          <Route path="/bookmarks" element={
            <ProtectedRoute><Bookmarks /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;

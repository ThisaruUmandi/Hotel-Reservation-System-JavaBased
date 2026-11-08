import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Account from './pages/Account';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminReservations from './pages/admin/AdminReservations';
import AdminRooms from './pages/admin/AdminRooms';
import AdminStaff from './pages/admin/AdminStaff';
import Book from './pages/Book';
import BookingDetail from './pages/BookingDetail';
import Home from './pages/Home';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import RoomDetail from './pages/RoomDetail';
import Rooms from './pages/Rooms';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/book/:id" element={<ProtectedRoute><Book /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="staff" element={<ProtectedRoute roles={['ADMIN']}><AdminStaff /></ProtectedRoute>} />
        </Route>
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

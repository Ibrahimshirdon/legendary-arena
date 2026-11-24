import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminRoute, ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/AuthContext'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminTournaments from '@/pages/admin/AdminTournaments'
import AdminUsers from '@/pages/admin/AdminUsers'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Login from '@/pages/auth/Login'
import PendingApproval from '@/pages/auth/PendingApproval'
import Register from '@/pages/auth/Register'
import ChatRedirect from '@/pages/chat/ChatRedirect'
import Dashboard from '@/pages/Dashboard'
import HallOfFame from '@/pages/halloffame/HallOfFame'
import Leaderboard from '@/pages/leaderboard/Leaderboard'
import Matches from '@/pages/matches/Matches'
import NotFound from '@/pages/NotFound'
import Notifications from '@/pages/notifications/Notifications'
import PlayerProfile from '@/pages/profile/PlayerProfile'
import TournamentRequests from '@/pages/requests/TournamentRequests'
import RoomDetails from '@/pages/rooms/RoomDetails'
import RoomsList from '@/pages/rooms/RoomsList'
import Settings from '@/pages/settings/Settings'
import TournamentDetails from '@/pages/tournaments/TournamentDetails'
import TournamentsList from '@/pages/tournaments/TournamentsList'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/pending" element={<PendingApproval />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<RoomsList />} />
            <Route path="/rooms/:roomId" element={<RoomDetails />} />
            <Route path="/chat" element={<ChatRedirect />} />
            <Route path="/tournaments" element={<TournamentsList />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetails />} />
            <Route path="/requests" element={<TournamentRequests />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile/:uid" element={<PlayerProfile />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tournaments"
              element={
                <AdminRoute>
                  <AdminTournaments />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

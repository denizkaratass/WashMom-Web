import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext.jsx'
import { AnalysisProvider } from './context/AnalysisContext.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Spinner from './components/Spinner.jsx'
import Home from './pages/Home.jsx'
import Analyze from './pages/Analyze.jsx'
import Result from './pages/Result.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Wardrobe from './pages/Wardrobe.jsx'
import GarmentDetail from './pages/GarmentDetail.jsx'
import Compare from './pages/Compare.jsx'
import NotFound from './pages/NotFound.jsx'

// Recharts büyük bir kütüphane; sadece Dashboard açılınca indirilsin.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))

const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalysisProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="analyze" element={<Analyze />} />
              <Route path="result" element={<Result />} />
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="register" element={<AuthPage mode="register" />} />
              <Route path="wardrobe" element={protect(<Wardrobe />)} />
              <Route path="wardrobe/:id" element={protect(<GarmentDetail />)} />
              <Route path="compare" element={protect(<Compare />)} />
              <Route
                path="dashboard"
                element={protect(
                  <Suspense fallback={<Spinner />}>
                    <Dashboard />
                  </Suspense>,
                )}
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AnalysisProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

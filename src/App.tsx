import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import { useAuth } from './lib/auth'
import BookingPage from './pages/BookingPage'
const Admin = lazy(() => import('./pages/Admin'))

const Home = lazy(() => import('./pages/Home'))

function RouteContent() {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="route-transition"
        initial={
          shouldReduceMotion
            ? { opacity: 0.9 }
            : { clipPath: 'circle(0% at 50% 50%)', opacity: 0.7, willChange: 'clip-path, opacity' }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : { clipPath: 'circle(150% at 50% 50%)', opacity: 1 }
        }
        exit={
          shouldReduceMotion
            ? { opacity: 0.9 }
            : { clipPath: 'circle(0% at 50% 50%)', opacity: 0.7 }
        }
        transition={{ duration: shouldReduceMotion ? 0.1 : 0.65, ease: [0.76, 0, 0.24, 1] }}
      >
        <Suspense fallback={<div className="route-loader" role="status">Opening the curtains...</div>}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/lobby" element={<Home />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route
              path="/book/:movieId/:showtimeId"
              element={<BookingPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  useEffect(() => { void useAuth.getState().restore() }, [])
  return (
    <BrowserRouter>
      <RouteContent />
    </BrowserRouter>
  )
}

export default App

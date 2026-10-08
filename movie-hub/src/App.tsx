import { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'

const Home = lazy(() => import('./pages/Home'))

function RouteContent() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="route-transition"
        initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0.7 }}
        animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
        exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0.7 }}
        transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
      >
        <Suspense fallback={<div className="route-loader" role="status">Opening the curtains...</div>}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/lobby" element={<Home />} />
            <Route
              path="/book/:movieId/:showtimeId"
              element={<section className="route-placeholder"><p>Booking opens soon.</p></section>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <RouteContent />
    </BrowserRouter>
  )
}

export default App

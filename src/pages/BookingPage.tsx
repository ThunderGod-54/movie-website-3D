import { useNavigate, useParams } from 'react-router-dom'
import BookingModal from '../components/BookingModal'
export default function BookingPage() {
  const { movieId, showtimeId } = useParams()
  const navigate = useNavigate()
  return <BookingModal initialMovieId={movieId} initialShowId={showtimeId} onClose={() => navigate('/lobby')} onGoToFood={() => navigate('/lobby')} />
}

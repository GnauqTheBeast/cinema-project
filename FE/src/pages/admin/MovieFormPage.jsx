import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { movieService } from '../../services/movieApi'

export default function MovieFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    director: '',
    cast: '',
    genre: '',
    duration: '',
    release_date: '',
    description: '',
    trailer_url: '',
    poster_url: '',
    status: 'UPCOMING',
  })

  useEffect(() => {
    if (isEditing) {
      fetchMovie()
    }
  }, [id, isEditing])

  const fetchMovie = async () => {
    try {
      setLoading(true)
      const data = await movieService.getMovieById(id)
      const movie = data.data

      setFormData({
        title: movie.title || '',
        director: movie.director || '',
        cast: movie.cast || '',
        genre: movie.genre || '',
        duration: movie.duration?.toString() || '',
        release_date: movie.release_date ? movie.release_date.split('T')[0] : '',
        description: movie.description || '',
        trailer_url: movie.trailer_url || '',
        poster_url: movie.poster_url || '',
        status: movie.status || 'UPCOMING',
      })
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load movie')
      console.error('Error fetching movie:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title?.trim() || !formData.duration) {
      setError('Title and duration are required')
      return
    }

    // Convert date to RFC3339 format if provided
    let release_date = null
    if (formData.release_date) {
      // Convert YYYY-MM-DD to RFC3339 format (YYYY-MM-DDTHH:MM:SSZ)
      release_date = new Date(formData.release_date + 'T00:00:00Z').toISOString()
    }

    const movieData = {
      ...formData,
      duration: parseInt(formData.duration, 10) || 0,
      release_date: release_date,
    }

    try {
      setSaving(true)

      if (isEditing) {
        await movieService.updateMovie(id, movieData)
      } else {
        await movieService.createMovie(movieData)
      }

      navigate('/admin/movies')
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} movie`)
      console.error(`Error ${isEditing ? 'updating' : 'creating'} movie:`, err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading movie...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/admin/movies')}
            style={{
              background: 'none',
              border: '1px solid #ddd',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            ← Back to Movies
          </button>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            {isEditing ? 'Edit Movie' : 'Add New Movie'}
          </h1>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter movie title"
              />
            </div>

            {/* Director */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Director
              </label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter director name"
              />
            </div>

            {/* Cast */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Cast
              </label>
              <input
                type="text"
                name="cast"
                value={formData.cast}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter main cast (comma separated)"
              />
            </div>

            {/* Genre and Duration */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Genre
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="e.g., Action, Drama, Comedy"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="120"
                />
              </div>
            </div>

            {/* Release Date and Status */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Release Date
                </label>
                <input
                  type="date"
                  name="release_date"
                  value={formData.release_date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="SHOWING">Now Showing</option>
                  <option value="ENDED">Ended</option>
                </select>
              </div>
            </div>

            {/* URLs */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Poster URL
              </label>
              <input
                type="url"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
                placeholder="https://example.com/poster.jpg"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Trailer URL
              </label>
              <input
                type="url"
                name="trailer_url"
                value={formData.trailer_url}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                placeholder="Enter movie description..."
              />
            </div>

            {/* Submit Buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/movies')}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: saving ? '#ccc' : '#1976d2',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                {saving ? 'Saving...' : isEditing ? 'Update Movie' : 'Create Movie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}

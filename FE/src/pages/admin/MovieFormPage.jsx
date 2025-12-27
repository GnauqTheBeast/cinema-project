import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { movieService } from '../../services/movieApi'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'

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

    let release_date = null
    if (formData.release_date) {
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
        <LoadingSpinner size="lg" text="Loading movie..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/movies')} className="mb-4">
            ← Back to Movies
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Movie' : 'Add New Movie'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-500 text-xl mr-3">⚠</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter movie title"
            />

            <Input
              label="Director"
              name="director"
              value={formData.director}
              onChange={handleChange}
              placeholder="Enter director name"
            />

            <Input
              label="Cast"
              name="cast"
              value={formData.cast}
              onChange={handleChange}
              placeholder="Enter main cast (comma separated)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="e.g., Action, Drama, Comedy"
              />

              <Input
                label="Duration (minutes)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                placeholder="120"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Release Date"
                name="release_date"
                type="date"
                value={formData.release_date}
                onChange={handleChange}
              />

              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="SHOWING">Now Showing</option>
                <option value="ENDED">Ended</option>
              </Select>
            </div>

            <Input
              label="Poster URL"
              name="poster_url"
              type="url"
              value={formData.poster_url}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
            />

            <Input
              label="Trailer URL"
              name="trailer_url"
              type="url"
              value={formData.trailer_url}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Enter movie description..."
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="secondary" onClick={() => navigate('/admin/movies')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update Movie' : 'Create Movie'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}

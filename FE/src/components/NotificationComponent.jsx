import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import websocketService from '../services/websocketService'

const NotificationComponent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [connectionStatus, setConnectionStatus] = useState(websocketService.getConnectionStatus())

  useEffect(() => {
    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(websocketService.getConnectionStatus())
    }, 1000)

    // Listen for notifications
    const handleNotification = (notification) => {
      console.log('=== RECEIVED NOTIFICATION ===')
      console.log('Full notification object:', JSON.stringify(notification, null, 2))
      console.log('notification.type:', notification.type)
      console.log('notification.data:', notification.data)
      console.log('Current pathname:', location.pathname)

      // Extract data from notification
      let title = 'New Notification'
      let message = 'You have a new notification'
      let type = notification.type || 'notification'

      if (notification.type === 'booking_notification' && notification.data) {
        console.log('✓ This is a booking_notification')
        // Access nested Data field
        const nestedData = notification.data.Data || notification.data
        console.log('notification.data.Data?.status:', nestedData.status)
        console.log('notification.data.Data?.booking_id:', nestedData.booking_id)

        title = nestedData.title || 'Booking Update'
        message = nestedData.message || 'Your booking has been updated'

        const isCompleted = nestedData.status === 'COMPLETED'
        const hasBookingId = !!nestedData.booking_id
        const isOnPaymentPage = location.pathname.includes('/payment')

        console.log('Redirect check:')
        console.log('  - isCompleted:', isCompleted)
        console.log('  - hasBookingId:', hasBookingId)
        console.log('  - isOnPaymentPage:', isOnPaymentPage)

        if (isCompleted && hasBookingId && isOnPaymentPage) {
          console.log('✓✓✓ ALL CONDITIONS MET - REDIRECTING TO SUCCESS PAGE')
          // Redirect to success page with bookingId after a short delay to show notification
          setTimeout(() => {
            console.log('Navigating to:', `/booking-success?bookingId=${nestedData.booking_id}`)
            navigate(`/booking-success?bookingId=${nestedData.booking_id}`)
          }, 2000)
        } else {
          console.log('✗ Redirect conditions not met')
        }
      } else {
        console.log('✗ Not a booking_notification or no data')
      }

      const newNotification = {
        id: Date.now(),
        title,
        message,
        type,
        data: notification.data || notification,
        timestamp: new Date().toISOString(),
      }

      setNotifications((prev) => [...prev, newNotification])

      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }

    websocketService.onNotification(handleNotification)

    return () => {
      clearInterval(statusInterval)
      websocketService.removeNotificationListener(handleNotification)
    }
  }, [location.pathname, navigate])

  const clearNotifications = () => {
    setNotifications([])
  }

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(-5).map((notification) => (
            <div
              key={notification.id}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 animate-slide-in"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {notification.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
            >
              Clear all notifications
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationComponent

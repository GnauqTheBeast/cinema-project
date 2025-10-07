import { useEffect, useState } from 'react'
import websocketService from '../services/websocketService'

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([])
  const [connectionStatus, setConnectionStatus] = useState(websocketService.getConnectionStatus())

  useEffect(() => {
    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(websocketService.getConnectionStatus())
    }, 1000)

    // Listen for notifications
    const handleNotification = (notification) => {
      console.log('Received notification:', notification)
      const newNotification = {
        id: Date.now(),
        message: notification,
        timestamp: new Date().toISOString(),
      }

      setNotifications((prev) => [...prev, newNotification])

      // Auto-remove notification after 3 seconds
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 3000)
    }

    websocketService.onNotification(handleNotification)

    return () => {
      clearInterval(statusInterval)
      websocketService.removeNotificationListener(handleNotification)
    }
  }, [])

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
                  <div className="text-sm font-medium text-gray-900">New Notification</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {JSON.stringify(notification.message, null, 2)}
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

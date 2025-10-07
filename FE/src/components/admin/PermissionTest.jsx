import { usePermissions } from '../../contexts/PermissionContext'

const PermissionTest = () => {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions, loading, error } =
    usePermissions()

  const testPermissions = [
    'movie_manage',
    'showtime_manage',
    'seat_manage',
    'report_view',
    'booking_create',
    'booking_manage',
    'ticket_issue',
    'payment_process',
    'ticket_view',
    'profile_view',
    'profile_update',
    'staff_manage',
  ]

  if (loading) {
    return <div className="p-4">Loading permissions...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Permission Test</h2>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Current Permissions:</h3>
        <div className="flex flex-wrap gap-2">
          {permissions.length > 0 ? (
            permissions.map((permission) => (
              <span
                key={permission}
                className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
              >
                {permission}
              </span>
            ))
          ) : (
            <span className="text-gray-500">No permissions found</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Permission Tests:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {testPermissions.map((permission) => (
            <div
              key={permission}
              className={`p-2 rounded text-sm ${
                hasPermission(permission)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {permission}: {hasPermission(permission) ? '✓' : '✗'}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Combined Tests:</h3>
        <div className="space-y-2">
          <div
            className={`p-2 rounded ${
              hasAnyPermission(['movie_manage', 'showtime_manage'])
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            Has any movie/showtime permission:{' '}
            {hasAnyPermission(['movie_manage', 'showtime_manage']) ? '✓' : '✗'}
          </div>
          <div
            className={`p-2 rounded ${
              hasAllPermissions(['profile_view', 'profile_update'])
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            Has all profile permissions:{' '}
            {hasAllPermissions(['profile_view', 'profile_update']) ? '✓' : '✗'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionTest

import apiClient from './apiClient'

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

export const permissionService = {
  // Get all roles with their permissions
  getAllRoles: async () => {
    const response = await apiClient.get('/roles')
    return response.data
  },

  // Get all available permissions
  getAllPermissions: async () => {
    const response = await apiClient.get('/permissions')
    return response.data
  },

  // Get permissions for a specific role
  getRolePermissions: async (roleId) => {
    const response = await apiClient.get(`/roles/${roleId}/permissions`)
    return response.data
  },

  // Update permissions for a role (bulk)
  updateRolePermissions: async (roleId, permissionIds) => {
    const response = await apiClient.put(`/roles/${roleId}/permissions`, {
      permission_ids: permissionIds
    })
    return response.data
  },

  // Assign single permission to role
  assignPermission: async (roleId, permissionId) => {
    const response = await apiClient.post(`/roles/${roleId}/permissions`, {
      permission_id: permissionId
    })
    return response.data
  },

  // Unassign permission from role
  unassignPermission: async (roleId, permissionId) => {
    const response = await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`)
    return response.data
  },

  // Refresh admin user info with latest permissions from database
  refreshAdminUserInfo: async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

      if (!adminToken || !adminUser.id) {
        console.error('No admin token or user info found')
        return false
      }

      // Decode token to get roleId
      const decoded = decodeToken(adminToken)
      const roleId = decoded?.roleId || adminUser.roleId

      if (!roleId) {
        console.error('No roleId found in token or user info')
        return false
      }

      // Fetch latest permissions for the role
      const rolePermsRes = await this.getRolePermissions(roleId)
      if (rolePermsRes.success && rolePermsRes.data) {
        const permissions = (rolePermsRes.data.permissions || []).map(p => p.code)

        // Update adminUser with new permissions
        const updatedAdminUser = {
          ...adminUser,
          permissions: permissions
        }

        // Save to localStorage
        localStorage.setItem('adminUser', JSON.stringify(updatedAdminUser))
        
        // Dispatch event to notify components
        window.dispatchEvent(new Event('adminUserUpdated'))
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error refreshing admin user info:', error)
      return false
    }
  }
}

// Export refreshAdminUserInfo for convenience
export const refreshAdminUserInfo = permissionService.refreshAdminUserInfo

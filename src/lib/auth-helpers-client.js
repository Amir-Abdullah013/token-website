// Client-safe auth helpers that don't import database libraries
// This file can be safely imported in client components

export const authHelpers = {
  // Get current user
  async getCurrentUser() {
    try {
      // Check localStorage for user session
      if (typeof window !== 'undefined') {
        const userSession = localStorage.getItem('userSession')
        if (userSession) {
          return JSON.parse(userSession)
        }
      }
      return null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch (error) {
      return false
    }
  },

  // Get user teams (for role management)
  async getUserTeams() {
    try {
      // Mock teams - replace with your actual database logic
      return []
    } catch (error) {
      console.error('Error getting user teams:', error)
      return []
    }
  },

  // Get active sessions
  async getActiveSessions() {
    try {
      const currentUser = await this.getCurrentUser()
      
      if (!currentUser) {
        return []
      }

      // Note: In a real implementation, you would fetch session data from your database
      // For now, we'll use mock data to avoid client-side database imports

      // Fallback to mock active sessions
      return [
        {
          id: 'session-1',
          device: 'Chrome on Windows',
          location: 'New York, NY',
          ipAddress: '192.168.1.100',
          lastActive: new Date().toISOString(),
          isCurrent: true,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        },
        {
          id: 'session-2',
          device: 'Safari on iPhone',
          location: 'San Francisco, CA',
          ipAddress: '192.168.1.101',
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isCurrent: false,
          userAgent: 'Mobile Safari'
        },
        {
          id: 'session-3',
          device: 'Firefox on Linux',
          location: 'London, UK',
          ipAddress: '192.168.1.102',
          lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          isCurrent: false,
          userAgent: 'Firefox'
        }
      ]
    } catch (error) {
      console.error('Error getting active sessions:', error)
      return []
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      // Mock password reset
      console.log('Mock: Password reset email sent to', email)
      return { success: true }
    } catch (error) {
      console.error('Error sending password recovery:', error)
      throw error
    }
  },

  // Verify email
  async verifyEmail(userId, secret) {
    try {
      // Mock email verification
      console.log('Mock: Email verification for user', userId)
      return { success: true }
    } catch (error) {
      console.error('Error verifying email:', error)
      throw error
    }
  },

  // OAuth methods
  async signInWithGoogle() {
    try {
      // Redirect to Google OAuth
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/oauth/google'
      }
      return { success: true }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  },

  async signInWithGithub() {
    try {
      // Redirect to GitHub OAuth
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/oauth/github'
      }
      return { success: true }
    } catch (error) {
      console.error('Error signing in with GitHub:', error)
      throw error
    }
  },

  async signInWithTwitter() {
    try {
      // Redirect to Twitter OAuth
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/oauth/twitter'
      }
      return { success: true }
    } catch (error) {
      console.error('Error signing in with Twitter:', error)
      throw error
    }
  }
}



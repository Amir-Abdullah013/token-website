import { config } from './config'

// Mock Supabase client for compatibility with existing code
// This allows the app to work with a regular database instead of Supabase
const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    // OAuth methods will be handled by custom implementation
    signInWithOAuth: async () => ({ data: { url: null }, error: null })
  }
}

// Log that we're using a mock client
if (typeof window !== 'undefined') {
  console.log('Using mock Supabase client - OAuth will be handled by custom implementation')
}

export { supabase }

// Auth helper functions
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

  // Sign in with email and password
  async signIn(email, password) {
    try {
      // Mock authentication - replace with your actual database logic
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: 'mock-user-id',
          email: email,
          name: 'Test User',
          role: 'user'
        }
        
        // Store in localStorage for session persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('userSession', JSON.stringify(mockUser))
        }
        
        return { user: mockUser }
      }
      
      // TODO: Implement actual database authentication
      throw new Error('Authentication not implemented for production')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  },

  // Sign up with email and password
  async signUp(email, password, name) {
    try {
      // Mock registration - replace with your actual database logic
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: 'mock-user-id',
          email: email,
          name: name,
          role: 'user'
        }
        
        return { user: mockUser }
      }
      
      // TODO: Implement actual database registration
      throw new Error('Registration not implemented for production')
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  },

  // Sign out
  async signOut() {
    try {
      // Clear localStorage session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userSession')
      }
      return { success: true }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
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

  // Send verification email
  async sendVerificationEmail() {
    try {
      // Mock email sending
      console.log('Mock: Verification email sent')
      return { success: true }
    } catch (error) {
      console.error('Error sending verification email:', error)
      throw error
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

  // Update user profile
  async updateProfile(name, phone) {
    try {
      // Mock profile update
      const user = await this.getCurrentUser()
      if (user) {
        user.name = name
        user.phone = phone
        if (typeof window !== 'undefined') {
          localStorage.setItem('userSession', JSON.stringify(user))
        }
      }
      return user
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  // Change password
  async changePassword(newPassword) {
    try {
      // Mock password change
      console.log('Mock: Password changed')
      return { success: true }
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  },

  // Google OAuth Sign In
  async signInWithGoogle() {
    try {
      // Check if we have the required configuration
      if (!config.oauth.google.clientId) {
        throw new Error('Google OAuth is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.')
      }

      // Try to use the API route for OAuth initiation
      try {
        const response = await fetch('/api/auth/oauth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to initiate Google OAuth')
        }

        const data = await response.json()
        
        if (data.url) {
          // Test if the OAuth URL is accessible
          try {
            const testResponse = await fetch(data.url, { method: 'HEAD' })
            if (testResponse.status === 404) {
              throw new Error('Google OAuth endpoint not accessible. Please check your OAuth app configuration.')
            }
          } catch (testError) {
            console.warn('OAuth endpoint test failed:', testError.message)
            // Continue with the OAuth flow anyway
          }
          
          // Redirect to Google OAuth
          window.location.href = data.url
          return { success: true }
        } else {
          throw new Error('No OAuth URL received from server')
        }
      } catch (apiError) {
        console.error('API route error:', apiError)
        
          // Fallback to direct OAuth URL construction
          console.log('Falling back to direct OAuth URL construction')
          
          const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
          const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(config.oauth.google.clientId)}&` +
            `redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/oauth-callback')}&` +
            `scope=${encodeURIComponent('openid email profile')}&` +
            `response_type=code&` +
            `state=google_${state}&` +
            `access_type=offline&` +
            `prompt=consent`
        
        // Redirect to Google OAuth
        window.location.href = googleAuthUrl
        return { success: true }
      }
    } catch (error) {
      console.error('Google OAuth Error:', error)
      throw error
    }
  },

  // GitHub OAuth Sign In
  async signInWithGithub() {
    try {
      // Check if we have the required configuration
      if (!config.oauth.github.clientId) {
        throw new Error('GitHub OAuth is not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID in your environment variables.')
      }

      // Try to use the API route for OAuth initiation
      try {
        const response = await fetch('/api/auth/oauth/github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to initiate GitHub OAuth')
        }

        const data = await response.json()
        
        if (data.url) {
          // Test if the OAuth URL is accessible
          try {
            const testResponse = await fetch(data.url, { method: 'HEAD' })
            if (testResponse.status === 404) {
              throw new Error('GitHub OAuth endpoint not accessible. Please check your OAuth app configuration.')
            }
          } catch (testError) {
            console.warn('OAuth endpoint test failed:', testError.message)
            // Continue with the OAuth flow anyway
          }
          
          // Redirect to GitHub OAuth
          window.location.href = data.url
          return { success: true }
        } else {
          throw new Error('No OAuth URL received from server')
        }
      } catch (apiError) {
        console.error('API route error:', apiError)
        
        // Fallback to direct OAuth URL construction
        console.log('Falling back to direct OAuth URL construction')
        
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
          `client_id=${encodeURIComponent(config.oauth.github.clientId)}&` +
          `redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/oauth-callback')}&` +
          `scope=${encodeURIComponent('user:email')}&` +
          `state=github_${state}`
        
        // Redirect to GitHub OAuth
        window.location.href = githubAuthUrl
        return { success: true }
      }
    } catch (error) {
      console.error('Error signing in with GitHub:', error)
      throw error
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
  }
}

export default supabase
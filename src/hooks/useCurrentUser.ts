"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  role: string;
  department?: { name: string };
}

export function useCurrentUser() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchCurrentUser()
    }
  }, [session?.user?.id])

  const fetchCurrentUser = async () => {
    if (!session?.user) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const result = await response.json()
        // Handle the new API response format
        const data = result.success ? result.data : result
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = () => {
    fetchCurrentUser()
  }

  // Return combined data - profile from API takes precedence over session
  const currentUser = session?.user ? {
    id: session.user.id,
    name: profile?.name || session.user.name || 'User',
    email: profile?.email || session.user.email || '',
    role: profile?.role || session.user.role || 'client',
    profileImage: profile?.profileImage || null,
    department: profile?.department || null
  } : null

  return {
    user: currentUser,
    loading,
    refreshProfile,
    isAuthenticated: !!session?.user
  }
}

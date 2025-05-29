"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user: {
    name: string
    profileImage?: string | null
    email?: string
  }
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
  showTooltip?: boolean
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm", 
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-20 w-20 text-xl"
}

const backgroundColors = [
  "bg-red-500",
  "bg-blue-500", 
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500"
]

function generateInitials(name: string): string {
  if (!name) return "?"
  
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    // Single word - take first 2 characters
    return words[0].substring(0, 2).toUpperCase()
  }
  
  // Multiple words - take first letter of first and last word
  const firstInitial = words[0][0] || ""
  const lastInitial = words[words.length - 1][0] || ""
  return (firstInitial + lastInitial).toUpperCase()
}

function getBackgroundColor(name: string): string {
  // Generate consistent color based on name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return backgroundColors[Math.abs(hash) % backgroundColors.length]
}

export function UserAvatar({ 
  user, 
  size = "md", 
  className,
  showTooltip = false 
}: UserAvatarProps) {
  const initials = generateInitials(user.name)
  const bgColor = getBackgroundColor(user.name)
  
  const avatarElement = (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={user.profileImage || undefined} 
        alt={`${user.name}'s profile picture`}
        className="object-cover"
      />
      <AvatarFallback 
        className={cn(
          bgColor,
          "text-white font-semibold border-2 border-white shadow-sm"
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )

  if (showTooltip) {
    return (
      <div className="group relative">
        {avatarElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {user.name}
          {user.email && (
            <div className="text-gray-300 text-xs">{user.email}</div>
          )}
        </div>
      </div>
    )
  }

  return avatarElement
}

// Specialized variants for different use cases
export function UserAvatarWithName({ 
  user, 
  size = "md", 
  showEmail = false,
  orientation = "horizontal",
  className 
}: UserAvatarProps & { 
  showEmail?: boolean
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <div className={cn(
      "flex items-center gap-3",
      orientation === "vertical" && "flex-col gap-2 text-center",
      className
    )}>
      <UserAvatar user={user} size={size} />
      <div className={cn(
        "flex flex-col",
        orientation === "vertical" && "items-center"
      )}>
        <span className="font-medium text-sm">{user.name}</span>
        {showEmail && user.email && (
          <span className="text-xs text-muted-foreground">{user.email}</span>
        )}
      </div>
    </div>
  )
}

// Group of avatars (for showing multiple assignees, etc.)
export function UserAvatarGroup({ 
  users, 
  size = "sm", 
  maxShow = 3,
  className 
}: {
  users: Array<{ name: string; profileImage?: string | null; email?: string }>
  size?: "xs" | "sm" | "md" | "lg"
  maxShow?: number
  className?: string
}) {
  const displayUsers = users.slice(0, maxShow)
  const remainingCount = users.length - maxShow

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={`${user.name}-${index}`}
          user={user}
          size={size}
          className="border-2 border-white ring-1 ring-gray-200"
          showTooltip
        />
      ))}
      {remainingCount > 0 && (
        <div className={cn(
          sizeClasses[size],
          "flex items-center justify-center rounded-full bg-gray-100 border-2 border-white text-gray-600 font-medium text-xs"
        )}>
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

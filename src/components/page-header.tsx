/**
 * Shared page components for the generated CRUD pages
 * These components utilize optimized session management
 */

'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  children: ReactNode
  className?: string
}

export function PageHeader({ children, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {children}
    </div>
  )
}

interface PageTitleProps {
  children: ReactNode
  className?: string
}

export function PageTitle({ children, className = '' }: PageTitleProps) {
  return (
    <h1 className={`text-2xl font-bold tracking-tight ${className}`}>
      {children}
    </h1>
  )
}

interface PageDescriptionProps {
  children: ReactNode
  className?: string
}

export function PageDescription({ children, className = '' }: PageDescriptionProps) {
  return (
    <p className={`text-muted-foreground ${className}`}>
      {children}
    </p>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import { Coffee, CheckCircle, Sparkles, ArrowRight } from 'lucide-react'

const MotionContainer = dynamic(() => import('@/features/home/components/motion-components').then(mod => mod.MotionContainer), { ssr: false })
const MotionItem = dynamic(() => import('@/features/home/components/motion-components').then(mod => mod.MotionItem), { ssr: false })

export function OrganizationWelcomePage() {
  const handleLetsBrew = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center px-4 overflow-hidden">
      <MotionContainer className="container max-w-4xl text-center">
        <MotionItem className="space-y-8">
          {/* Success Icon with Animation */}
          <div className="relative mx-auto w-32 h-32 mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
            <div className="relative bg-primary rounded-full w-32 h-32 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-primary animate-bounce" />
          </div>

          {/* Welcome Message */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              🎉 Welcome to Your Workspace!
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Your organization has been successfully set up. Everything is ready for you to start brewing amazing customer relationships!
            </p>
          </div>

          {/* Features Preview */}
          <MotionItem className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12 max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Coffee className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Customer Management</h3>
              <p className="text-sm text-muted-foreground">Centralized customer data and interactions</p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Analytics</h3>
              <p className="text-sm text-muted-foreground">Insights to grow your business</p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">Work together seamlessly</p>
            </div>
          </MotionItem>

          {/* CTA Button */}
          <MotionItem className="pt-8">
            <Button 
              size="lg" 
              onClick={handleLetsBrew}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-lg px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Coffee className="w-6 h-6 mr-3" />
              Let's Brew Together
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              Sign in to access your personalized CRM workspace
            </p>
          </MotionItem>

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse delay-1000"></div>
        </MotionItem>
      </MotionContainer>
    </div>
  )
}

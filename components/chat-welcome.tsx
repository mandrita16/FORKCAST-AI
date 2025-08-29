"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Utensils,
  Users,
  Award,
  AlertCircle,
  HelpCircle,
  MapPin,
  Clock,
  Smartphone,
  Shield,
  TrendingUp,
  Globe,
  Zap,
} from "lucide-react"

interface ChatWelcomeProps {
  onQuickAction: (message: string) => void
}

export function ChatWelcome({ onQuickAction }: ChatWelcomeProps) {
  const quickActions = [
    {
      icon: Utensils,
      label: "Donate Food",
      message: "I want to donate surplus food",
      color: "hover:bg-green-100 hover:border-green-300",
    },
    {
      icon: Users,
      label: "Volunteer",
      message: "I want to volunteer for food pickup",
      color: "hover:bg-blue-100 hover:border-blue-300",
    },
    {
      icon: Award,
      label: "My Impact",
      message: "Show my impact and achievements",
      color: "hover:bg-purple-100 hover:border-purple-300",
    },
    {
      icon: AlertCircle,
      label: "Emergency",
      message: "Emergency food rescue needed",
      color: "hover:bg-red-100 hover:border-red-300",
    },
    {
      icon: HelpCircle,
      label: "How it Works",
      message: "How does FORKCAST work?",
      color: "hover:bg-indigo-100 hover:border-indigo-300",
    },
    {
      icon: MapPin,
      label: "Near Me",
      message: "Find food rescue locations near me",
      color: "hover:bg-orange-100 hover:border-orange-300",
    },
    {
      icon: Clock,
      label: "Timings",
      message: "What are the pickup timings?",
      color: "hover:bg-teal-100 hover:border-teal-300",
    },
    {
      icon: Smartphone,
      label: "Mobile App",
      message: "How to use the mobile app?",
      color: "hover:bg-cyan-100 hover:border-cyan-300",
    },
    {
      icon: Shield,
      label: "Safety",
      message: "Is my food donation safe and secure?",
      color: "hover:bg-emerald-100 hover:border-emerald-300",
    },
    {
      icon: TrendingUp,
      label: "Statistics",
      message: "Show FORKCAST statistics and impact",
      color: "hover:bg-pink-100 hover:border-pink-300",
    },
    {
      icon: Globe,
      label: "Food Types",
      message: "What types of food can I donate?",
      color: "hover:bg-yellow-100 hover:border-yellow-300",
    },
    {
      icon: Zap,
      label: "AI Features",
      message: "How does AI prediction work?",
      color: "hover:bg-violet-100 hover:border-violet-300",
    },
  ]

  return (
    <Card className="mb-6 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-V4JmXF39dzakA6ls1cVlH7o15M9piK.png"
              alt="FORKCAST Logo"
              className="h-16 w-16 drop-shadow-lg"
            />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Welcome to FORKCAST-AI
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The world's first AI-powered food rescue network. We eliminate food waste and feed those in need through
            predictive AI intervention, connecting donors with volunteers for maximum impact.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onQuickAction(action.message)}
              className={`text-xs ${action.color} transition-all duration-200 h-auto py-3 flex flex-col items-center gap-2`}
            >
              <action.icon className="w-4 h-4" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-green-700 font-medium">
            🌱 Join our mission: <span className="font-bold">68M tonnes</span> of food waste eliminated •
            <span className="font-bold"> 194M people</span> fed • <span className="font-bold">95%+</span> AI accuracy
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

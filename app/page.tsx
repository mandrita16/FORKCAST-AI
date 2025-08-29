"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import {
  Heart,
  Send,
  User,
  AlertCircle,
  Plus,
  Trash2,
  MessageSquare,
  Utensils,
  Users,
  Award,
  HelpCircle,
  MapPin,
  Clock,
  Smartphone,
  Shield,
  TrendingUp,
  Globe,
  Zap,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseBrowserClient()

  const getCurrentSession = () => {
    return sessions.find((session) => session.id === currentSessionId)
  }

  useEffect(() => {
    const savedSessions = localStorage.getItem("forkcast-chat-sessions")
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        messages: session.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        })),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }))
      setSessions(parsedSessions)

      if (parsedSessions.length > 0) {
        setCurrentSessionId(parsedSessions[0].id)
      } else {
        createNewSession()
      }
    } else {
      createNewSession()
    }
  }, [])

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("forkcast-chat-sessions", JSON.stringify(sessions))
    }
  }, [sessions])

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [getCurrentSession()?.messages, isLoading])

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm FORKCAST-AI, your intelligent food rescue assistant. I help connect food donors with volunteers to eliminate food waste and feed those in need. I can assist you with:\n\n🍽️ **Food Donation** - Register surplus food for rescue\n👥 **Volunteer Matching** - Find nearby volunteers for pickup\n📊 **Impact Tracking** - See your environmental and social impact\n🚨 **Emergency Mode** - Handle urgent food rescue situations\n🏆 **Rewards & Badges** - Track your rescue achievements\n💰 **Micro-donations** - Contribute to transportation costs\n🐕 **NGO Partnerships** - Connect with animal care organizations\n\nHow can I help you make a difference today?",
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setSidebarOpen(false)
  }

  const updateCurrentSession = (updates: Partial<ChatSession>) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId ? { ...session, ...updates, updatedAt: new Date() } : session,
      ),
    )
  }

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId))

    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter((session) => session.id !== sessionId)
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id)
      } else {
        createNewSession()
      }
    }
  }

  const generateSessionTitle = (firstMessage: string) => {
    const words = firstMessage.split(" ").slice(0, 4)
    return words.join(" ") + (firstMessage.split(" ").length > 4 ? "..." : "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    console.log("[v0] Submitting message:", input.trim())

    if (input.length > 4000) {
      setError("Message is too long. Please keep it under 4000 characters.")
      return
    }

    const currentSession = getCurrentSession()
    if (!currentSession) {
      console.log("[v0] No current session found")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    }

    const isFirstUserMessage = currentSession.messages.length === 1 && currentSession.title === "New Chat"
    const sessionUpdates: Partial<ChatSession> = {
      messages: [...currentSession.messages, userMessage],
    }

    if (isFirstUserMessage) {
      sessionUpdates.title = generateSessionTitle(input.trim())
    }

    updateCurrentSession(sessionUpdates)
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Making API request to /api/chat")
      const response = await fetch("/api/chat?stream=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...currentSession.messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        console.log("[v0] API error response:", errorText)
        // Fall back to friendly message if API returns non-2xx
        updateCurrentSession({
          messages: [
            ...currentSession.messages,
            userMessage,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content:
                "The service is temporarily unavailable. Please try again shortly. You can still ask about features, safety, or how it works.",
              createdAt: new Date(),
            },
          ],
        })
        return
      }

      // Stream tokens incrementally
      setIsStreaming(true)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""
      const assistantId = (Date.now() + 1).toString()
      // create placeholder assistant message to update as tokens arrive
      updateCurrentSession({
        messages: [
          ...currentSession.messages,
          userMessage,
          { id: assistantId, role: "assistant", content: "", createdAt: new Date() },
        ],
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        assistantContent += chunk
        const updated = getCurrentSession()
        if (!updated) continue
        updateCurrentSession({
          messages: updated.messages.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m,
          ),
        })
      }

      setIsStreaming(false)
      console.log("[v0] Streaming complete")
    } catch (error) {
      console.error("[v0] Chat error:", error)
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
      console.log("[v0] Request completed, loading set to false")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setError(null)
  }

  const currentSession = getCurrentSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex">
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-r border-border bg-white/80 backdrop-blur-sm`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Chat History</h2>
            <Button
              onClick={createNewSession}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent hover:bg-green-100 hover:border-green-300 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${session.id === currentSessionId
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm"
                    : "hover:bg-green-50 hover:shadow-sm"
                    }`}
                  onClick={() => {
                    setCurrentSessionId(session.id)
                    setSidebarOpen(false)
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.updatedAt.toLocaleDateString()}</p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-green-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 mr-2 hover:bg-green-100 transition-colors duration-200"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2 animate-pulse">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-V4JmXF39dzakA6ls1cVlH7o15M9piK.png"
                    alt="FORKCAST Logo"
                    className="h-8 w-8 drop-shadow-sm"
                    onError={(e) => {
                      console.log("[v0] Logo failed to load, using fallback")
                      e.currentTarget.style.display = "none"
                    }}
                  />
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    FORKCAST
                  </span>
                </div>
              </div>
              <div className="text-sm text-green-700 font-medium">AI-Powered Food Rescue Network</div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google" })
                    if (error) {
                      setError(error.message)
                    }
                  }}
                  className="h-8"
                >
                  Sign in with Google
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const email = prompt("Enter your email for a magic link:")
                    if (!email) return
                    const { error } = await supabase.auth.signInWithOtp({ email })
                    if (error) setError(error.message)
                  }}
                  className="h-8"
                >
                  Email Magic Link
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
          <Card className="h-full flex flex-col shadow-lg border-green-100 bg-white/90 backdrop-blur-sm">
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {currentSession?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Heart className="w-4 h-4 text-green-600" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${message.role === "user"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white ml-auto"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200"
                        }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert">
                        {message.content}
                      </div>
                      <p className="text-xs opacity-70 mt-2">{message.createdAt.toLocaleTimeString()}</p>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Heart className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <CardContent className="p-6 border-t border-green-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("I want to donate surplus food")}
                  className="text-xs hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                >
                  <Utensils className="w-3 h-3 mr-1" />
                  Donate Food
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("I want to volunteer for food pickup")}
                  className="text-xs hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Volunteer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Show my impact and achievements")}
                  className="text-xs hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
                >
                  <Award className="w-3 h-3 mr-1" />
                  My Impact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Emergency food rescue needed")}
                  className="text-xs hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Emergency
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("How does FORKCAST work?")}
                  className="text-xs hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  How it Works
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Find food rescue locations near me")}
                  className="text-xs hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Near Me
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What are the pickup timings?")}
                  className="text-xs hover:bg-teal-100 hover:border-teal-300 transition-all duration-200"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Timings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("How to use the mobile app?")}
                  className="text-xs hover:bg-cyan-100 hover:border-cyan-300 transition-all duration-200"
                >
                  <Smartphone className="w-3 h-3 mr-1" />
                  Mobile App
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Is my food donation safe and secure?")}
                  className="text-xs hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Safety
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Show FORKCAST statistics and impact")}
                  className="text-xs hover:bg-pink-100 hover:border-pink-300 transition-all duration-200"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Statistics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What types of food can I donate?")}
                  className="text-xs hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Food Types
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("How does AI prediction work?")}
                  className="text-xs hover:bg-violet-100 hover:border-violet-300 transition-all duration-200"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  AI Features
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about food donation, volunteering, app features, safety, timings, or any FAQ..."
                  disabled={isLoading}
                  className="flex-1 border-green-200 focus:border-green-400 focus:ring-green-400 transition-all duration-200"
                  maxLength={4000}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>

              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-green-700 font-medium">
                  🌱 FORKCAST-AI helps eliminate food waste and feed those in need through AI-powered matching.
                </p>
                <p className="text-xs text-muted-foreground">{input.length}/4000</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

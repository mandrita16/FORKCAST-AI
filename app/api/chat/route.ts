import { type NextRequest, NextResponse } from "next/server"
import { FORKCAST_SYSTEM_PROMPT } from "@/lib/ai/system-prompt"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage.content || typeof lastMessage.content !== "string" || lastMessage.content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    if (lastMessage.content.length > 4000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 })
    }

    const url = new URL(request.url)
    const wantsStream = url.searchParams.get("stream") === "1" || url.searchParams.get("stream") === "true"

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not found in environment variables")
      if (wantsStream) {
        const encoder = new TextEncoder()
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                "The AI service is temporarily unavailable due to missing configuration. Please add GROQ_API_KEY and try again.",
              ),
            )
            controller.close()
          },
        })
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
      }
      return NextResponse.json(
        {
          content:
            "The AI service is temporarily unavailable due to missing server configuration. You can still explore features and FAQs, or try again later.",
          notice: "Missing GROQ_API_KEY on server",
        },
        { status: 200 },
      )
    }

    const systemPrompt = FORKCAST_SYSTEM_PROMPT

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let retryCount = 0
    const maxRetries = 2

    while (retryCount <= maxRetries) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            max_tokens: 1000,
            temperature: 0.7,
            stream: wantsStream,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error(`Groq API error (attempt ${retryCount + 1}):`, response.status, errorData)

          // Handle specific error cases
          if (response.status === 429) {
            if (retryCount < maxRetries) {
              retryCount++
              await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
              continue
            }
            return NextResponse.json({ error: "Service is busy. Please wait a moment and try again." }, { status: 429 })
          }

          if (response.status === 401) {
            return NextResponse.json(
              {
                content:
                  "The AI service is unavailable due to authentication issues. Please try again later while we resolve it.",
                notice: "Groq API 401",
              },
              { status: 200 },
            )
          }

          if (response.status >= 500) {
            if (retryCount < maxRetries) {
              retryCount++
              await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
              continue
            }
            return NextResponse.json(
              {
                content:
                  "The AI service is experiencing high load. Please try again in a moment.",
                notice: "Groq API 5xx after retries",
              },
              { status: 200 },
            )
          }

          return NextResponse.json(
            { content: "I couldn't process your request right now. Please try again in a moment.", notice: "Unhandled Groq error" },
            { status: 200 },
          )
        }

        if (wantsStream) {
          if (!response.body) {
            return NextResponse.json({ content: "Streaming not available." }, { status: 200 })
          }

          const decoder = new TextDecoder()
          const encoder = new TextEncoder()
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              const reader = response.body!.getReader()
              let accumulated = ""
              try {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  const chunk = decoder.decode(value, { stream: true })
                  // Groq uses OpenAI-compatible SSE. Extract incremental content.
                  const lines = chunk
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter(Boolean)
                  for (const line of lines) {
                    if (line === "data: [DONE]") continue
                    if (line.startsWith("data:")) {
                      try {
                        const json = JSON.parse(line.slice(5).trim())
                        const delta = json?.choices?.[0]?.delta?.content || ""
                        if (delta) {
                          accumulated += delta
                          controller.enqueue(encoder.encode(delta))
                        }
                      } catch {
                        // ignore parse errors on keepalives
                      }
                    }
                  }
                }
              } finally {
                controller.close()
              }
            },
          })

          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
        } else {
          const data = await response.json()
          const content =
            data.choices?.[0]?.message?.content ||
            "I apologize, but I couldn't generate a response. Please try again."

          return NextResponse.json({ content })
        }
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${retryCount + 1}):`, fetchError)

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return NextResponse.json(
            {
              content: "The request timed out. Please try again with a shorter message or retry shortly.",
              notice: "AbortError timeout",
            },
            { status: 200 },
          )
        }

        if (retryCount < maxRetries) {
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
          continue
        }

        throw fetchError
      }
    }
  } catch (error) {
    console.error("Chat API error:", error)

    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json({ content: "Too many requests. Please wait a moment and try again.", notice: "rate limit" }, { status: 200 })
      }
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        return NextResponse.json({ content: "Service temporarily unavailable. Please try again later.", notice: "auth config" }, { status: 200 })
      }
      if (error.message.includes("timeout") || error.message.includes("ECONNRESET")) {
        return NextResponse.json({ content: "Connection timeout. Please try again.", notice: "timeout/ECONNRESET" }, { status: 200 })
      }
    }

    return NextResponse.json({ content: "An unexpected error occurred. Please try again." }, { status: 200 })
  }
}

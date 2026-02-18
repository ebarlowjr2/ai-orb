import { NextResponse } from "next/server";
import { extractText, isOnTopic, offTopicResponse, systemPrompt } from "@/lib/guardrails";
import { rateLimit } from "@/lib/rateLimit";

const API_URL = "https://api.openai.com/v1/responses";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type LLMResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function getEnvNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function getApiKey() {
  const key = process.env.LLM_API_KEY;
  if (!key) throw new Error("Missing LLM_API_KEY");
  return key;
}

function getModel() {
  return process.env.LLM_MODEL || "gpt-4o-mini";
}

function getTopic() {
  return process.env.WEBINAR_TOPIC || "the webinar topic";
}

function clampText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd();
}

async function callLLM(messages: { role: string; content: string }[]) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getModel(),
      input: messages,
      max_output_tokens: 512,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM error: ${response.status} ${errorText}`);
  }

  return (await response.json()) as LLMResponse;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local";

    const rateLimitPerMin = getEnvNumber("RATE_LIMIT_PER_MIN", 10);
    const limitStatus = rateLimit(ip, rateLimitPerMin);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as { messages?: Message[]; sessionId?: string };
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }

    const maxTurns = getEnvNumber("MAX_TURNS_PER_SESSION", 20);
    const maxInputChars = getEnvNumber("MAX_INPUT_CHARS", 1200);
    const maxOutputChars = getEnvNumber("MAX_OUTPUT_CHARS", 1200);

    const userTurns = body.messages.filter((message) => message.role === "user").length;
    if (userTurns > maxTurns) {
      return NextResponse.json(
        { error: "Turn limit reached for this session." },
        { status: 400 }
      );
    }

    const latestUserMessage = [...body.messages].reverse().find((msg) => msg.role === "user");
    if (!latestUserMessage) {
      return NextResponse.json({ error: "User message required." }, { status: 400 });
    }

    if (latestUserMessage.content.length > maxInputChars) {
      return NextResponse.json(
        { error: `Message too long. Max ${maxInputChars} characters.` },
        { status: 400 }
      );
    }

    const topic = getTopic();
    const strictMode = (process.env.STRICT_TOPIC_MODE || "true").toLowerCase() === "true";

    if (strictMode) {
      const onTopic = await isOnTopic(latestUserMessage.content, topic);
      if (!onTopic) {
        return NextResponse.json(offTopicResponse(topic));
      }
    }

    const response = await callLLM([
      { role: "system", content: systemPrompt(topic) },
      ...body.messages,
    ]);

    const rawText = extractText(response);
    const assistantText = clampText(rawText || "", maxOutputChars) || "(No response)";

    return NextResponse.json({ assistantText, suggestions: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

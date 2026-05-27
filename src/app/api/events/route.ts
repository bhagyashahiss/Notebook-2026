import { NextResponse } from "next/server";
import { subscribe } from "@/lib/events";

export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\\n\\n`),
        );
      };

      send({ type: "connected" });

      const unsubscribe = subscribe((event) => {
        send(event);
      });

      const heartbeat = setInterval(() => {
        send({ type: "ping", at: Date.now() });
      }, 15000);

      // @ts-expect-error custom close hook for cleanup.
      controller._cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      // No-op. Cleanup is attached above.
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

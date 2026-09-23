// Simple in-memory event broadcaster for Next.js serverless/edge instances
type Listener = (data: { event: string; data: any }) => void;

class SSEBroker {
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(event: string, data: any) {
    for (const listener of this.listeners) {
      try {
        listener({ event, data });
      } catch (err) {
        console.error("SSE broadcast error:", err);
      }
    }
  }
}

// Global singleton to persist during development and hot-reloads
declare global {
  var __clinicos_sse_broker: SSEBroker | undefined;
}

export const sseBroker = global.__clinicos_sse_broker || new SSEBroker();
if (process.env.NODE_ENV !== "production") {
  global.__clinicos_sse_broker = sseBroker;
}

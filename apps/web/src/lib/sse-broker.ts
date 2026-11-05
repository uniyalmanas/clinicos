// Simple in-memory event broadcaster for Next.js serverless/edge instances.
// Events are scoped per clinic so one tenant never receives another's updates.
type Listener = (data: { event: string; data: any }) => void;

class SSEBroker {
  private listeners: Map<string, Set<Listener>> = new Map();

  public subscribe(clinicId: string, listener: Listener): () => void {
    const key = String(clinicId || "platform");
    const bucket = this.listeners.get(key) || new Set<Listener>();
    bucket.add(listener);
    this.listeners.set(key, bucket);
    return () => {
      bucket.delete(listener);
      if (bucket.size === 0) this.listeners.delete(key);
    };
  }

  public broadcast(event: string, data: any, clinicId?: string | null) {
    if (!clinicId) {
      console.warn("[sse] dropped broadcast without a clinic scope:", event);
      return;
    }
    const bucket = this.listeners.get(String(clinicId));
    if (!bucket) return;
    for (const listener of bucket) {
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

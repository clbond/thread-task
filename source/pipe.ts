export type Handler = <T>(message: T) => void;

export interface Subscription {
  unsubscribe(): void;
}

export interface Pipe {
  /// Subscribe to incoming messages
  subscribe(handler: Handler): Subscription;

  /// Post an outgoing message
  postMessage<T>(message: T): void;
}

/// Internal pipe implementation
export class PipeImpl {
  private incomingHandlers = new Set<Handler>();
  private outgoingHandlers = new Set<Handler>();

  subscribe(handler: Handler) {
    return this.internalSubscribe(this.incomingHandlers, handler);
  }

  postMessage<T>(message: T) {
    this.outgoingHandlers.forEach(handler => handler(message));
  }

  postIncomingMessage<T>(message: T) {
    this.incomingHandlers.forEach(handler => handler(message));
  }

  subscribeOutgoing(handler: Handler) {
    return this.internalSubscribe(this.outgoingHandlers, handler);
  }

  private internalSubscribe(set: Set<Handler>, handler: Handler) {
    this.incomingHandlers.add(handler);

    return {
      unsubscribe: () => this.incomingHandlers.delete(handler),
    };
  }
}
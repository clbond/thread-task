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

  private incomingBuffer = new Array<any>();
  private outgoingBuffer = new Array<any>();

  subscribe(handler: Handler) {
    return this.internalSubscribe(this.incomingHandlers, this.incomingBuffer, handler);
  }

  postMessage<T>(message: T) {
    if (this.outgoingHandlers.size > 0) {
      this.outgoingHandlers.forEach(handler => handler(message));
    }
    else {
      this.outgoingBuffer.push(message);
    }
  }

  postIncomingMessage<T>(message: T) {
    if (this.incomingHandlers.size > 0) {
      this.incomingHandlers.forEach(handler => handler(message));
    }
    else {
      this.incomingBuffer.push(message);
    }
  }

  subscribeOutgoing(handler: Handler) {
    return this.internalSubscribe(this.outgoingHandlers, this.outgoingBuffer, handler);
  }

  private internalSubscribe(set: Set<Handler>, buffer: Array<any>, handler: Handler) {
    set.add(handler);

    if (buffer.length > 0) {
      buffer.forEach(message => handler(message));
      buffer.splice(0, buffer.length);
    }

    return {unsubscribe: () => set.delete(handler)};
  }
}
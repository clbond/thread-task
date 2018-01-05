export type Handler<T> = (message: T) => void;

export interface Subscription {
  unsubscribe(): void;
}

export interface Pipe {
  /// Subscribe to incoming messages
  subscribe<T = any>(handler: Handler<T>): Subscription;

  /// Post an outgoing message
  postMessage<T>(message: T): void;
}

/// Internal pipe implementation
export class PipeImpl {
  private incomingHandlers = new Set<Handler<any>>();
  private outgoingHandlers = new Set<Handler<any>>();

  private incomingBuffer = new Array<any>();
  private outgoingBuffer = new Array<any>();

  subscribe<T = any>(handler: Handler<T>) {
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

  subscribeOutgoing<T = any>(handler: Handler<T>) {
    return this.internalSubscribe(this.outgoingHandlers, this.outgoingBuffer, handler);
  }

  private internalSubscribe<T>(set: Set<Handler<T>>, buffer: Array<any>, handler: Handler<T>) {
    set.add(handler);

    if (buffer.length > 0) {
      buffer.forEach(message => handler(message));
      buffer.splice(0, buffer.length);
    }

    return {unsubscribe: () => set.delete(handler)};
  }
}
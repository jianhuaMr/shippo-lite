/** Error thrown when the Shippo API returns a non-2xx response. */
export class ShippoError extends Error {
  /** HTTP status code returned by the API. */
  readonly status: number;
  /** Parsed response body, if any. */
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ShippoError";
    this.status = status;
    this.body = body;
    // Restore prototype chain for instanceof to work after transpilation.
    Object.setPrototypeOf(this, ShippoError.prototype);
  }
}

/** Error thrown when a request exceeds the configured timeout. */
export class ShippoTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Shippo request timed out after ${timeoutMs}ms`);
    this.name = "ShippoTimeoutError";
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, ShippoTimeoutError.prototype);
  }
}

import { logger } from "./logger";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly name: string,
    private readonly failureThreshold = 3,
    private readonly openMs = 30000,
  ) {}

  canRequest(): boolean {
    if (this.state === "OPEN" && Date.now() - this.openedAt >= this.openMs) {
      this.changeState("HALF_OPEN");
    }

    return this.state !== "OPEN";
  }

  onSuccess(): void {
    this.failures = 0;
    if (this.state !== "CLOSED") this.changeState("CLOSED");
  }

  onFailure(): void {
    this.failures += 1;

    if (this.state === "HALF_OPEN" || this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
      this.changeState("OPEN");
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  private changeState(next: CircuitState): void {
    logger.warn("circuit_breaker.estado", {
      servico: this.name,
      de: this.state,
      para: next,
      falhas: this.failures,
    });
    this.state = next;
  }
}

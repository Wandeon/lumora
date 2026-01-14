/**
 * Base interface for all Domain Events
 * Domain events represent something that happened in the domain
 */
export interface DomainEvent {
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly aggregateId: string;
}

/**
 * Base class for domain events with common implementation
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public abstract readonly eventType: string;
  public abstract readonly aggregateId: string;

  constructor() {
    this.occurredAt = new Date();
  }
}

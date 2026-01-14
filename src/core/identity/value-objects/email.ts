import { ValueObject } from '@core/shared';
import { Result } from '@core/shared';

interface EmailProps {
  value: string;
}

/**
 * Email Value Object
 * Validates and encapsulates email addresses
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(email: string): Result<Email, string> {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      return Result.fail('Email cannot be empty');
    }

    if (!this.EMAIL_REGEX.test(trimmed)) {
      return Result.fail('Invalid email format');
    }

    return Result.ok(new Email({ value: trimmed }));
  }
}

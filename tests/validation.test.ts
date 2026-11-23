import { describe, expect, it } from 'vitest';
import { checkoutDetailsSchema, contactSchema } from '../src/schemas/validation';

describe('edge validation', () => {
  it('accepts a complete checkout detail set', () => {
    expect(checkoutDetailsSchema.safeParse({
      firstName: 'Mara', lastName: 'Bloom', email: 'mara@example.com', phone: '4155550199',
      line1: '118 Petal Lane', line2: '', city: 'Arcadia', state: 'CA', postalCode: '94107', consent: true,
    }).success).toBe(true);
  });

  it('rejects invalid contact input and missing consent', () => {
    const result = contactSchema.safeParse({ name: 'A', email: 'not-email', phone: '', topic: 'general', preferredContact: 'email', message: 'short', website: '', consented: false });
    expect(result.success).toBe(false);
  });
});

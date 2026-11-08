import { describe, expect, it, vi } from 'vitest';
import { postForm } from './gateway';

function fakeDocument() {
  const make = () => ({ children: [], appendChild(child) { this.children.push(child); }, submit: vi.fn() });
  const doc = { created: [], body: { children: [], appendChild(child) { this.children.push(child); } } };
  doc.createElement = (tag) => { const el = { tag, ...make() }; doc.created.push(el); return el; };
  return doc;
}

describe('postForm', () => {
  it('posts every field to the gateway as hidden inputs', () => {
    const doc = fakeDocument();
    postForm('https://sandbox.payhere.lk/pay/checkout', { order_id: 'RES1-ABC', amount: '55500.00', hash: 'E081' }, doc);

    const form = doc.created[0];
    expect(form.tag).toBe('form');
    expect(form.method).toBe('POST');
    expect(form.action).toBe('https://sandbox.payhere.lk/pay/checkout');
    expect(form.children.map((i) => [i.type, i.name, i.value])).toEqual([
      ['hidden', 'order_id', 'RES1-ABC'],
      ['hidden', 'amount', '55500.00'],
      ['hidden', 'hash', 'E081'],
    ]);
    expect(doc.body.children).toContain(form);
    expect(form.submit).toHaveBeenCalledOnce();
  });
});

/*
 * Email Subscribe Block
 * Renders a heading + supporting text and an email capture field with a submit button.
 * Authored structure (rows):
 *   Row 1: eyebrow label (e.g. "SUBSCRIBE") - optional
 *   Row 2: heading (bold lead-in line)
 *   Row 3: supporting paragraph
 *   Row 4: submit action link/label (href = form action; text = aria-label) - optional
 */

export default function decorate(block) {
  const rows = [...block.children];

  const eyebrow = rows[0]?.textContent.trim() || '';
  const headingEl = rows[1]?.firstElementChild || rows[1];
  const bodyEl = rows[2]?.firstElementChild || rows[2];
  const actionLink = rows[3]?.querySelector('a');

  const action = actionLink?.getAttribute('href') || '';
  const submitLabel = actionLink?.textContent.trim() || 'Subscribe';

  block.textContent = '';

  if (eyebrow) {
    const eyebrowEl = document.createElement('p');
    eyebrowEl.className = 'email-subscribe-eyebrow';
    eyebrowEl.textContent = eyebrow;
    block.append(eyebrowEl);
  }

  if (headingEl && headingEl.textContent.trim()) {
    const heading = document.createElement('p');
    heading.className = 'email-subscribe-heading';
    heading.textContent = headingEl.textContent.trim();
    block.append(heading);
  }

  if (bodyEl && bodyEl.textContent.trim()) {
    const body = document.createElement('p');
    body.className = 'email-subscribe-body';
    body.textContent = bodyEl.textContent.trim();
    block.append(body);
  }

  const form = document.createElement('form');
  form.className = 'email-subscribe-form';
  if (action) form.setAttribute('action', action);
  form.setAttribute('method', 'get');
  form.setAttribute('novalidate', '');

  const label = document.createElement('label');
  label.className = 'email-subscribe-label';
  label.setAttribute('for', 'email-subscribe-input');
  label.textContent = 'Email';

  const field = document.createElement('div');
  field.className = 'email-subscribe-field';

  const input = document.createElement('input');
  input.type = 'email';
  input.id = 'email-subscribe-input';
  input.name = 'email';
  input.placeholder = 'Email address';
  input.setAttribute('aria-label', 'Email address');
  input.required = true;

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'email-subscribe-submit';
  submit.setAttribute('aria-label', submitLabel);

  field.append(input, submit);
  form.append(label, field);
  block.append(form);

  form.addEventListener('submit', (e) => {
    if (!input.value || !input.checkValidity()) {
      e.preventDefault();
      input.focus();
    }
  });
}

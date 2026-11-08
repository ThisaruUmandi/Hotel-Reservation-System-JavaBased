/**
 * Sends the guest to a payment gateway's page by posting a form, which is how hosted checkouts such as PayHere
 * work. The fields come from our server already signed, so the browser only passes them along.
 */
export function postForm(url, fields, doc = document) {
  const form = doc.createElement('form');
  form.method = 'POST';
  form.action = url;
  Object.entries(fields).forEach(([name, value]) => {
    const input = doc.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  doc.body.appendChild(form);
  form.submit();
}

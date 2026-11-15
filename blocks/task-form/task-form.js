/**
 * task-form — the first screen for a personal AI agent (homepage-cohorts agent experience).
 * A native form: one radio per task, a named submit button, a reserved result area. The answer
 * lives in the URL (?task=…), so a reload shows the same result. The result is the product's own
 * link, handed to the person; signing in and applying stay with the person.
 *
 * Authoring:
 *   header: legend, submit button label, empty-result text, in that order: one row of three
 *     cells (document authoring) or three one-cell rows (Universal Editor block fields)
 *   then one row per task: link to the product page (its text names the task) | description
 */
const PARAM = 'task';

function taskId(href) {
  try {
    const { pathname, hash } = new URL(href, window.location.href);
    return `${pathname}${hash}`.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'home';
  } catch (e) {
    return '';
  }
}

function setParam(value) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(PARAM, value);
  else url.searchParams.delete(PARAM);
  window.history.replaceState(null, '', url);
}

export default function decorate(block) {
  const all = [...block.children];
  const rows = all.filter((row) => row.querySelector('a'));
  const headCells = all.filter((row) => !rows.includes(row)).flatMap((row) => [...row.children]);
  const [legendCell, buttonCell, emptyCell] = headCells;

  const form = document.createElement('form');
  form.className = 'task-form-form';
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  if (legendCell) legend.append(...legendCell.childNodes);
  fieldset.append(legend);

  const options = [];
  rows.forEach((row) => {
    const [linkCell, descCell] = [...row.children];
    const link = linkCell?.querySelector('a');
    if (!link) return;
    const id = taskId(link.href);
    const option = document.createElement('div');
    option.className = 'task-form-option';
    const input = document.createElement('input');
    Object.assign(input, {
      type: 'radio', name: PARAM, value: id, id: `task-${id}`,
    });
    const label = document.createElement('label');
    label.htmlFor = input.id;
    const name = document.createElement('span');
    name.className = 'task-form-name';
    name.textContent = link.textContent.trim();
    label.append(name);
    if (descCell) {
      const desc = document.createElement('span');
      desc.className = 'task-form-desc';
      desc.append(...descCell.childNodes);
      label.append(desc);
    }
    option.append(input, label);
    fieldset.append(option);
    options.push({ id, input, link });
  });

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary';
  if (buttonCell) button.append(...buttonCell.childNodes);

  const result = document.createElement('div');
  result.className = 'task-form-result';
  result.setAttribute('role', 'status');
  const empty = document.createElement('div');
  empty.className = 'task-form-empty';
  if (emptyCell) empty.append(...emptyCell.childNodes);
  result.append(empty);

  function show(id) {
    const chosen = options.find((o) => o.id === id);
    result.querySelector('.task-form-next')?.remove();
    empty.hidden = !!chosen;
    if (!chosen) return;
    chosen.input.checked = true;
    const next = document.createElement('p');
    next.className = 'task-form-next';
    const a = document.createElement('a');
    a.href = chosen.link.href;
    a.textContent = chosen.link.textContent.trim();
    next.append(a);
    result.append(next);
  }

  form.append(fieldset, button);
  // every answer goes into the URL at once, so a reload keeps it (agent-experience rule 7)
  form.addEventListener('change', (e) => {
    if (e.target.name !== PARAM) return;
    setParam(e.target.value);
    show(e.target.value);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = form.querySelector(`input[name="${PARAM}"]:checked`)?.value || '';
    setParam(value);
    show(value);
  });

  block.replaceChildren(form, result);
  show(new URLSearchParams(window.location.search).get(PARAM));
}

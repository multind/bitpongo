export function trapSheetTab(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || !(event.currentTarget instanceof HTMLElement)) return;
  const sheet = event.currentTarget;
  const candidates = [...sheet.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')];
  const focusable = candidates.filter((element) => {
    if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name) return true;
    const group = candidates.filter(
      (item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === 'radio' && item.name === element.name,
    );
    return element === (group.find((item) => item.checked) || group[0]);
  });
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

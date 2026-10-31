import { afterEach, describe, expect, it } from 'vitest';
import { trapSheetTab } from './timezone-sheet';

afterEach(() => document.body.replaceChildren());

describe('timezone sheet keyboard containment', () => {
  it('wraps Tab and Shift+Tab within actions and the checked radio', () => {
    const sheet = document.createElement('section');
    sheet.innerHTML =
      '<button>Cancel</button><button>Confirm</button><input type="radio" name="zone"><input type="radio" name="zone" checked>';
    document.body.append(sheet);
    sheet.addEventListener('keydown', trapSheetTab);
    const first = sheet.querySelector('button')!;
    const last = sheet.querySelector<HTMLInputElement>('input:checked')!;
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);
  });
});

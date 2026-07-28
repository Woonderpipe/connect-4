export function reportOperationalError(context: string): void {
  if (typeof console !== 'undefined') {
    console.error('[connect4]', context);
  }
}

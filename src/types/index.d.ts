declare module 'mustache' {
  interface View {
    [key: string]: unknown;
  }
  interface Partials {
    [key: string]: string;
  }
  export function render(template: string, view: View, partials?: Partials): string;
  export let tags: [string, string];
}

declare module 'pluralize' {
  export default function pluralize(word: string): string;
}

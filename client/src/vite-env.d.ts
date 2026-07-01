/// <reference types="vite/client" />

declare module "@nimiq/identicons" {
  export const IdenticonsAssets: string;
  export function makeHash(text: string): string;
  export function hashToRGB(main: string, background: string, accent: string): { main: string; background: string; accent: string };
  export function hashToIndices(main: string, background: string, accent: string): { main: number; background: number; accent: number };
  export function getBackgroundColorName(text: string): string;
  export const colorNames: readonly string[];
  export const colors: readonly string[];
  export const backgroundColors: readonly string[];

  export default class Identicons {
    static svg(text: string): Promise<string>;
    static render(text: string, element: HTMLElement): Promise<void>;
    static toDataUrl(text: string): Promise<string>;
    static placeholder(color?: string, strokeWidth?: number): string;
    static renderPlaceholder(element: HTMLElement, color?: string, strokeWidth?: number): void;
    static placeholderToDataUrl(color?: string, strokeWidth?: number): string;
    static image(text: string): Promise<HTMLImageElement>;
  }
}

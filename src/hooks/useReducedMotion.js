import { useMediaQuery } from './useMediaQuery.js';

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useFinePointer() {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}

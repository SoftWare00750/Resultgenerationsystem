import { create } from 'zustand';
import { Result } from '@/types';

interface ResultState {
  currentResult: Result | null;
  results: Result[];
  setCurrentResult: (result: Result | null) => void;
  setResults: (results: Result[]) => void;
  addResult: (result: Result) => void;
  updateResult: (resultId: string, data: Partial<Result>) => void;
  removeResult: (resultId: string) => void;
}

export const useResultStore = create<ResultState>((set) => ({
  currentResult: null,
  results: [],
  setCurrentResult: (currentResult) => set({ currentResult }),
  setResults: (results) => set({ results }),
  addResult: (result) => set((state) => ({ results: [result, ...state.results] })),
  updateResult: (resultId, data) => set((state) => ({
    results: state.results.map(r => r.$id === resultId ? { ...r, ...data } : r),
    currentResult: state.currentResult?.$id === resultId 
      ? { ...state.currentResult, ...data } 
      : state.currentResult
  })),
  removeResult: (resultId) => set((state) => ({
    results: state.results.filter(r => r.$id !== resultId),
    currentResult: state.currentResult?.$id === resultId ? null : state.currentResult
  })),
}));
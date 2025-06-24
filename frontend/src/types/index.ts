// Re-export API types for convenience
export * from './api';

// Additional frontend-specific types can be added here
export interface AppState {
  isLoading: boolean;
  currentPage: string;
  error: string | null;
}
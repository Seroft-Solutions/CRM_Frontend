'use client';

import { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  ReactNode 
} from 'react';
import { [[dto]] } from '@/core/api/generated/schemas';

// Action types
type Action = 
  | { type: 'SET_ITEM'; payload: [[dto]] | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUCCESS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// State interface
interface State {
  current: [[dto]] | null;
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: State = {
  current: null,
  loading: false,
  success: false,
  error: null
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ITEM':
      return { ...state, current: action.payload, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, success: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context interface
interface Context extends State {
  setItem: (item: [[dto]] | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSuccess: (isSuccess: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create context with a generic type
const [[entity]]Context = createContext<Context | undefined>(undefined);

// Provider component
function [[entity]]Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setItem = useCallback((item: [[dto]] | null) => {
    dispatch({ type: 'SET_ITEM', payload: item });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  const setSuccess = useCallback((isSuccess: boolean) => {
    dispatch({ type: 'SET_SUCCESS', payload: isSuccess });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = {
    ...state,
    setItem,
    setLoading,
    setSuccess,
    setError,
    reset
  };

  return (
    <[[entity]]Context.Provider value={value}>
      {children}
    </[[entity]]Context.Provider>
  );
}

// Export both context and provider
export { [[entity]]Context, [[entity]]Provider };

// Hook for using the context
export function use[[entity]]() {
  const context = useContext([[entity]]Context);
  if (!context) {
    throw new Error('use[[entity]] must be used within [[entity]]Provider');
  }
  return context;
}

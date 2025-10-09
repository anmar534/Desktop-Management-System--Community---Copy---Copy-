import { useCallback, useRef, useState } from 'react';

export function useUndoStack<T>(limit = 20) {
  const stackRef = useRef<T[]>([]);
  const [size, setSize] = useState(0);

  const push = useCallback((snapshot: T) => {
    stackRef.current.push(snapshot);
  if (stackRef.current.length > limit) stackRef.current.shift();
    setSize(stackRef.current.length);
  }, [limit]);

  const pop = useCallback(() => {
    const v = stackRef.current.pop();
    setSize(stackRef.current.length);
    return v ?? null;
  }, []);

  const clear = useCallback(() => {
    stackRef.current = [];
    setSize(0);
  }, []);

  return { push, pop, clear, size };
}

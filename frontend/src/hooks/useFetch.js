import { useState, useCallback } from 'react';
import api from '../services/api';

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (options) => {
      try {
        setIsLoading(true);
        setError(null);

        const method = options?.method || 'GET';
        const response = await api({
          url,
          method,
          data: options?.body,
        });

        setData(response.data);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [url]
  );

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, fetchData, refetch };
}

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client.js';

// The member's own year with ILC: the month they are in and how their video, article and book are going.
export function useMyJourney() {
  return useQuery({
    queryKey: ['my-journey'],
    queryFn: async () => (await api.get('/dashboard/journey')).data.journey,
    staleTime: 5 * 60_000,
  });
}

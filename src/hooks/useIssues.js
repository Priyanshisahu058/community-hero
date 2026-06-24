import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchIssues, fetchIssueById, createIssue } from '../services/issues'

export function useIssues(filters = {}) {
  return useQuery({
    queryKey: ['issues', filters],
    queryFn: () => fetchIssues(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

export function useIssue(id) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => fetchIssueById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export default useIssues

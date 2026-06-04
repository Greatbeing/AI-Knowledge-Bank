import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchKnowledgeNodes,
  fetchKnowledgeNodeById,
  createKnowledgeNodeDB,
  updateKnowledgeNodeDB,
  deleteKnowledgeNodeDB,
  fetchValidationRequests,
  submitValidationRequestDB,
  approveValidationRequestDB,
  rejectValidationRequestDB,
  type KnowledgeNodeDB,
} from '../api/supabase-client';

// ==================== Knowledge Nodes Hooks ====================

export function useKnowledgeNodes(filters?: {
  skillCategory?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['knowledgeNodes', filters],
    queryFn: () => fetchKnowledgeNodes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useKnowledgeNode(id: string) {
  return useQuery({
    queryKey: ['knowledgeNode', id],
    queryFn: () => fetchKnowledgeNodeById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateKnowledgeNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (node: Partial<KnowledgeNodeDB>) => createKnowledgeNodeDB(node),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeNodes'] });
    },
  });
}

export function useUpdateKnowledgeNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<KnowledgeNodeDB> }) =>
      updateKnowledgeNodeDB(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeNodes'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeNode', id] });
    },
  });
}

export function useDeleteKnowledgeNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteKnowledgeNodeDB(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeNodes'] });
    },
  });
}

// ==================== Validation Requests Hooks ====================

export function useValidationRequests(nodeId?: string) {
  return useQuery({
    queryKey: ['validationRequests', nodeId],
    queryFn: () => fetchValidationRequests(nodeId),
    enabled: nodeId !== undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSubmitValidationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, requesterId }: { nodeId: string; requesterId: string }) =>
      submitValidationRequestDB(nodeId, requesterId),
    onSuccess: (_, { nodeId }) => {
      queryClient.invalidateQueries({ queryKey: ['validationRequests', nodeId] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeNode', nodeId] });
    },
  });
}

export function useApproveValidationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => approveValidationRequestDB(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeNodes'] });
    },
  });
}

export function useRejectValidationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => rejectValidationRequestDB(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeNodes'] });
    },
  });
}

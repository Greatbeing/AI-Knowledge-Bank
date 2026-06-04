import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type KnowledgeNodeDB = {
  id: string;
  title: string;
  description: string;
  skill_category: string;
  content: string;
  parent_id: string | null;
  version: number;
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  cas_score: number;
  created_at: string;
  updated_at: string;
  author_id: string;
};

export type ValidationRequestDB = {
  id: string;
  node_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export async function fetchKnowledgeNodes(filters?: {
  skillCategory?: string;
  status?: string;
  limit?: number;
}): Promise<KnowledgeNodeDB[]> {
  let query = supabase
    .from('knowledge_nodes')
    .select('*')
    .order('cas_score', { ascending: false });

  if (filters?.skillCategory) {
    query = query.eq('skill_category', filters.skillCategory);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function fetchKnowledgeNodeById(id: string): Promise<KnowledgeNodeDB | null> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createKnowledgeNodeDB(node: Partial<KnowledgeNodeDB>): Promise<KnowledgeNodeDB> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .insert([node])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKnowledgeNodeDB(
  id: string,
  updates: Partial<KnowledgeNodeDB>
): Promise<KnowledgeNodeDB> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteKnowledgeNodeDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_nodes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchValidationRequests(nodeId?: string): Promise<ValidationRequestDB[]> {
  let query = supabase
    .from('validation_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (nodeId) {
    query = query.eq('node_id', nodeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function submitValidationRequestDB(
  nodeId: string,
  requesterId: string
): Promise<ValidationRequestDB> {
  const { data, error } = await supabase
    .from('validation_requests')
    .insert([{ node_id: nodeId, requester_id: requesterId, status: 'pending' }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function approveValidationRequestDB(requestId: string): Promise<ValidationRequestDB> {
  const { data, error } = await supabase
    .from('validation_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  
  // Also update the node status
  if (data) {
    await supabase
      .from('knowledge_nodes')
      .update({ status: 'validated' })
      .eq('id', data.node_id);
  }

  return data;
}

export async function rejectValidationRequestDB(requestId: string): Promise<ValidationRequestDB> {
  const { data, error } = await supabase
    .from('validation_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;

  if (data) {
    await supabase
      .from('knowledge_nodes')
      .update({ status: 'rejected' })
      .eq('id', data.node_id);
  }

  return data;
}

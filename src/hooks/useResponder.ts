import { useState, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Response as IncidentResponse } from '../types';

export function useResponder(userId?: string) {
  const [loading, setLoading] = useState(false);

  const acceptIncident = useCallback(
    async (incidentId: string): Promise<IncidentResponse | null> => {
      if (!userId) return null;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(TABLES.RESPONSES)
          .insert({
            incident_id: incidentId,
            responder_id: userId,
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;

        // Increment responder count
        await supabase.rpc('increment_responder_count', {
          incident_id: incidentId,
        });

        return data as IncidentResponse;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const markArrived = useCallback(
    async (responseId: string) => {
      await supabase
        .from(TABLES.RESPONSES)
        .update({ arrived_at: new Date().toISOString() })
        .eq('id', responseId);
    },
    []
  );

  const completeResponse = useCallback(
    async (responseId: string) => {
      await supabase
        .from(TABLES.RESPONSES)
        .update({ status: 'completed' })
        .eq('id', responseId);
    },
    []
  );

  const toggleDuty = useCallback(
    async (isActive: boolean) => {
      if (!userId) return;
      await supabase
        .from(TABLES.USERS)
        .update({ is_active_responder: isActive, last_seen: new Date().toISOString() })
        .eq('id', userId);
    },
    [userId]
  );

  return { loading, acceptIncident, markArrived, completeResponse, toggleDuty };
}

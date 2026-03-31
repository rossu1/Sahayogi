import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Incident } from '../types';
import { haversineDistance, NEARBY_RADIUS_METERS } from '../lib/geo';

export function useIncidents(lat?: number, lng?: number) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNearby = useCallback(async () => {
    if (!lat || !lng) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from(TABLES.INCIDENTS)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (data) {
        const nearby = data.filter((inc: Incident) => {
          const dist = haversineDistance(lat, lng, inc.lat, inc.lng);
          return dist <= NEARBY_RADIUS_METERS;
        });
        setIncidents(nearby);
      }
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    fetchNearby();
    // Subscribe to realtime
    const channel = supabase
      .channel('incidents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLES.INCIDENTS },
        () => fetchNearby()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNearby]);

  const createIncident = useCallback(
    async (incident: Omit<Incident, 'id' | 'created_at' | 'resolved_at' | 'responder_count' | 'status'>) => {
      const { data, error } = await supabase
        .from(TABLES.INCIDENTS)
        .insert({ ...incident, status: 'active', responder_count: 0 })
        .select()
        .single();
      if (error) throw error;
      return data as Incident;
    },
    []
  );

  return { incidents, loading, fetchNearby, createIncident };
}

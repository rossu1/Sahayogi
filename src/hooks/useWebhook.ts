import { useCallback } from 'react';
import { sendPoliceAlert, sendNASAlert } from '../lib/webhook';

export function useWebhook() {
  const dispatchPoliceAlert = useCallback(
    async (opts: {
      alertType: string;
      landmark: string;
      lat: number;
      lng: number;
      trackingToken: string;
      phone?: string;
    }) => {
      return sendPoliceAlert(opts);
    },
    []
  );

  const dispatchNASAlert = useCallback(
    async (opts: {
      situation: string;
      landmark: string;
      lat: number;
      lng: number;
      phone?: string;
    }) => {
      return sendNASAlert(opts);
    },
    []
  );

  return { dispatchPoliceAlert, dispatchNASAlert };
}

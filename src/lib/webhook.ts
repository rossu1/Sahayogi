import { WebhookPayload } from '../types';
import { mapsUrl, trackingUrl } from './geo';

const POLICE_WEBHOOK = process.env.EXPO_PUBLIC_POLICE_WEBHOOK_URL ?? '';
const NAS_WEBHOOK = process.env.EXPO_PUBLIC_NAS_WEBHOOK_URL ?? '';

export async function sendWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function sendPoliceAlert(opts: {
  alertType: string;
  landmark: string;
  lat: number;
  lng: number;
  trackingToken: string;
  phone?: string;
}): Promise<boolean> {
  const payload: WebhookPayload = {
    type: 'police_alert',
    situation: opts.alertType,
    landmark: opts.landmark || 'Not specified',
    lat: opts.lat,
    lng: opts.lng,
    maps_url: mapsUrl(opts.lat, opts.lng),
    tracking_url: trackingUrl(opts.trackingToken),
    time: new Date().toISOString(),
    reporter_phone: opts.phone,
  };
  return sendWebhook(POLICE_WEBHOOK, payload);
}

export async function sendNASAlert(opts: {
  situation: string;
  landmark: string;
  lat: number;
  lng: number;
  phone?: string;
}): Promise<boolean> {
  const payload: WebhookPayload = {
    type: 'health_emergency',
    situation: opts.situation,
    landmark: opts.landmark || 'Not specified',
    lat: opts.lat,
    lng: opts.lng,
    maps_url: mapsUrl(opts.lat, opts.lng),
    tracking_url: mapsUrl(opts.lat, opts.lng),
    time: new Date().toISOString(),
    reporter_phone: opts.phone,
  };
  return sendWebhook(NAS_WEBHOOK, payload);
}

import { PostHog } from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';

let _client: PostHog | null = null;

export function initPostHog(): void {
  if (__DEV__) return;
  const key = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  if (!key) return;
  _client = new PostHog(key, { host: 'https://us.i.posthog.com' });
}

export const analytics = {
  capture(event: string, properties?: PostHogEventProperties): void {
    _client?.capture(event, properties);
  },
  identify(id: string, properties?: PostHogEventProperties): void {
    _client?.identify(id, properties);
  },
  reset(): void {
    _client?.reset();
  },
};

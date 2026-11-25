import { getStoredSettings } from './accountService';
import { isRoomMuted, subscribeChatEvents } from './chatService';

export type NotificationAccess = 'granted' | 'denied' | 'default' | 'unsupported';

const NOTIFICATION_BODY_MAX_LENGTH = 120;
const BEEP_FREQUENCY_HZ = 880;
const BEEP_VOLUME = 0.08;
const BEEP_DURATION_SECONDS = 0.15;

let audioContext: AudioContext | null = null;

const playBeep = (): void => {
    try {
        audioContext ??= new AudioContext();
        void audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = BEEP_FREQUENCY_HZ;
        gain.gain.value = BEEP_VOLUME;
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + BEEP_DURATION_SECONDS);
    } catch {
        return;
    }
};

export const getNotificationAccess = (): NotificationAccess =>
    'Notification' in window ? Notification.permission : 'unsupported';

export const requestNotificationAccess = async (): Promise<NotificationAccess> =>
    'Notification' in window ? Notification.requestPermission() : 'unsupported';

export const startMessageNotifications = (): (() => void) =>
    subscribeChatEvents((event) => {
        if (event.type !== 'message' || event.fromMe || event.viewing || isRoomMuted(event.roomId)) return;
        const settings = getStoredSettings();
        if (settings.messageSound) playBeep();
        if (settings.desktopNotifications && getNotificationAccess() === 'granted') {
            const body = `${event.message.senderId}: ${event.message.text}`.slice(0, NOTIFICATION_BODY_MAX_LENGTH);
            const notification = new Notification(event.roomId, { body, tag: event.roomId });
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    });
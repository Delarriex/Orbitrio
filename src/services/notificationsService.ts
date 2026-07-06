import {
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "../lib/firebase";

export type NotificationType = "success" | "info" | "warning" | "error";

export interface NotificationAction {
  label: string;
  view: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  recipientEmail?: string;
  audience?: "user" | "admin";
  eventKey?: string;
  action?: NotificationAction;
  text?: string;
  time?: string;
}

export interface BuildNotificationOptions {
  id?: string;
  title?: string;
  message?: string;
  type?: NotificationType;
  timestamp?: string;
  read?: boolean;
  recipientEmail?: string | null;
  audience?: "user" | "admin";
  eventKey?: string;
  action?: NotificationAction;
}

const notificationCollection = "notifications";

const sanitizeIdPart = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");

export const getNotificationDocumentId = (recipientEmail: string | null | undefined, eventKey?: string) => {
  if (recipientEmail && eventKey) {
    return `not-${sanitizeIdPart(recipientEmail)}-${sanitizeIdPart(eventKey)}`;
  }
  return `not-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const buildNotification = (
  textOrOptions: string | BuildNotificationOptions,
  maybeOptions: BuildNotificationOptions = {}
): NotificationItem => {
  const options = typeof textOrOptions === "string"
    ? { ...maybeOptions, message: maybeOptions.message || textOrOptions }
    : textOrOptions;
  const timestamp = options.timestamp || new Date().toISOString();
  const title = options.title || "Account update";
  const message = options.message || options.title || "You have a new notification.";
  const id = options.id || getNotificationDocumentId(options.recipientEmail, options.eventKey);

  return {
    id,
    title,
    message,
    type: options.type || "info",
    timestamp,
    read: options.read ?? false,
    recipientEmail: options.recipientEmail || undefined,
    audience: options.audience,
    eventKey: options.eventKey,
    action: options.action,
    text: message,
    time: formatRelativeTimestamp(timestamp)
  };
};

export const normalizeNotification = (data: Partial<NotificationItem> & { id?: string }, fallbackId?: string): NotificationItem => {
  const timestamp = data.timestamp || new Date().toISOString();
  const message = data.message || data.text || "You have a new notification.";
  return {
    id: data.id || fallbackId || getNotificationDocumentId(data.recipientEmail, data.eventKey),
    title: data.title || "Account update",
    message,
    type: data.type || "info",
    timestamp,
    read: data.read === true,
    recipientEmail: data.recipientEmail,
    audience: data.audience,
    eventKey: data.eventKey,
    action: data.action,
    text: message,
    time: formatRelativeTimestamp(timestamp)
  };
};

export const sortNotifications = (notifications: NotificationItem[]) =>
  [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const formatRelativeTimestamp = (timestamp: string) => {
  const then = new Date(timestamp).getTime();
  if (!Number.isFinite(then)) return "Just now";

  const diffMs = Date.now() - then;
  const absDiff = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absDiff < minute) return "Just now";
  if (absDiff < hour) {
    const value = Math.floor(absDiff / minute);
    return `${value} minute${value === 1 ? "" : "s"} ago`;
  }
  if (absDiff < day) {
    const value = Math.floor(absDiff / hour);
    return `${value} hour${value === 1 ? "" : "s"} ago`;
  }
  if (absDiff < 2 * day) return "Yesterday";
  if (absDiff < 7 * day) {
    const value = Math.floor(absDiff / day);
    return `${value} day${value === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
};

export const watchNotifications = (
  recipientEmail: string,
  onNotifications: (notifications: NotificationItem[]) => void,
  onError: (error: unknown) => void
) => {
  const notificationsQuery = query(collection(db, notificationCollection), where("recipientEmail", "==", recipientEmail));
  return onSnapshot(notificationsQuery, (snapshot: any) => {
    const loaded: NotificationItem[] = [];
    snapshot.forEach((docSnap: any) => {
      loaded.push(normalizeNotification({ id: docSnap.id, ...docSnap.data() }, docSnap.id));
    });
    onNotifications(sortNotifications(loaded));
  }, onError);
};

export const saveNotification = async (notification: NotificationItem) => {
  await setDoc(doc(db, notificationCollection, notification.id), notification, { merge: true });
};

export const markNotificationReadById = async (notificationId: string) => {
  await updateDoc(doc(db, notificationCollection, notificationId), { read: true });
};

export const markNotificationsReadById = async (notificationIds: string[]) => {
  await Promise.all(notificationIds.map((notificationId) => markNotificationReadById(notificationId)));
};

export const deleteNotificationById = async (notificationId: string) => {
  await deleteDoc(doc(db, notificationCollection, notificationId));
};

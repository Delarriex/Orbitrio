import type { Announcement } from "../types";
import { timestampId, todayIsoDate } from "./utils";

export type AnnouncementPriority = "Normal" | "Important" | "Critical";

export type AnnouncementInput = Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>;

const priorityRank: Record<AnnouncementPriority, number> = {
  Critical: 3,
  Important: 2,
  Normal: 1
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const time = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
};

export const normalizeAnnouncement = (input: AnnouncementInput, fallbackId = timestampId("ann")): Announcement => {
  const now = new Date().toISOString();
  return {
    ...input,
    id: input.id || fallbackId,
    title: input.title.trim(),
    content: input.content.trim(),
    date: input.date || todayIsoDate(),
    pinned: Boolean(input.pinned),
    enabled: input.enabled ?? true,
    priority: input.priority || "Normal",
    publishDate: input.publishDate || input.scheduledDate || "",
    expiryDate: input.expiryDate || "",
    scheduledDate: input.publishDate || input.scheduledDate || undefined,
    updatedAt: now
  };
};

export const isAnnouncementActive = (announcement: Announcement, now = new Date()) => {
  if (announcement.enabled === false) return false;
  const today = new Date(now.toISOString().split("T")[0]).getTime();
  const publishTime = parseDate(announcement.publishDate || announcement.scheduledDate);
  const expiryTime = parseDate(announcement.expiryDate);
  if (publishTime !== null && today < publishTime) return false;
  if (expiryTime !== null && today > expiryTime) return false;
  return true;
};

export const sortAnnouncementsForUsers = (announcements: Announcement[]) =>
  [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const dateCompare = (b.publishDate || b.date).localeCompare(a.publishDate || a.date);
    if (dateCompare !== 0) return dateCompare;
    return priorityRank[b.priority || "Normal"] - priorityRank[a.priority || "Normal"];
  });

export const sortAnnouncementsForAdmin = (announcements: Announcement[]) =>
  [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.updatedAt || b.date).localeCompare(a.updatedAt || a.date);
  });

export const filterActiveAnnouncements = (announcements: Announcement[]) =>
  sortAnnouncementsForUsers(announcements.filter(announcement => isAnnouncementActive(announcement)));

export const isAnnouncementRead = (announcementId: string, readIds: string[] = []) => readIds.includes(announcementId);


import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['user', 'group_director', 'secretary', 'it_team']);
export const meetingTypeEnum = pgEnum('meeting_type', ['offline', 'online', 'miscellaneous']);
export const bookingStatusEnum = pgEnum('booking_status', ['submitted', 'gd_approved', 'gd_rejected', 'secretary_approved', 'secretary_rejected', 'it_setup_complete', 'completed', 'cancelled']);
export const venueStatusEnum = pgEnum('venue_status', ['available', 'occupied', 'maintenance']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default('user'),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const venues = pgTable("venues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  floor: text("floor").notNull(),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  status: venueStatusEnum("status").notNull().default('available'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  venueId: varchar("venue_id").notNull().references(() => venues.id),
  eventTitle: text("event_title").notNull(),
  eventDescription: text("event_description"),
  meetingType: meetingTypeEnum("meeting_type").notNull(),
  eventDate: timestamp("event_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  expectedAttendees: integer("expected_attendees").notNull(),
  department: text("department").notNull(),
  requestedResources: jsonb("requested_resources").$type<string[]>().default([]),
  specialRequirements: text("special_requirements"),
  status: bookingStatusEnum("status").notNull().default('submitted'),
  gdApprovalDate: timestamp("gd_approval_date"),
  gdRemarks: text("gd_remarks"),
  secretaryApprovalDate: timestamp("secretary_approval_date"),
  secretaryRemarks: text("secretary_remarks"),
  itSetupDate: timestamp("it_setup_date"),
  itRemarks: text("it_remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  overallRating: integer("overall_rating").notNull(),
  venueRating: text("venue_rating").notNull(),
  itSupportRating: text("it_support_rating").notNull(),
  feedbackText: text("feedback_text"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookingHistory = pgTable("booking_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  status: bookingStatusEnum("status").notNull(),
  remarks: text("remarks"),
  changedBy: varchar("changed_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  feedback: many(feedback),
  historyChanges: many(bookingHistory),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  venue: one(venues, { fields: [bookings.venueId], references: [venues.id] }),
  feedback: many(feedback),
  history: many(bookingHistory),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  booking: one(bookings, { fields: [feedback.bookingId], references: [bookings.id] }),
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));

export const bookingHistoryRelations = relations(bookingHistory, ({ one }) => ({
  booking: one(bookings, { fields: [bookingHistory.bookingId], references: [bookings.id] }),
  changedBy: one(users, { fields: [bookingHistory.changedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  status: true,
  gdApprovalDate: true,
  gdRemarks: true,
  secretaryApprovalDate: true,
  secretaryRemarks: true,
  itSetupDate: true,
  itRemarks: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertBookingHistorySchema = createInsertSchema(bookingHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertBookingHistory = z.infer<typeof insertBookingHistorySchema>;
export type BookingHistory = typeof bookingHistory.$inferSelect;
export type Resource = typeof resources.$inferSelect;

// Additional types for API responses
export type BookingWithDetails = Booking & {
  user: User;
  venue: Venue;
  history?: BookingHistory[];
};

export type UserRole = 'user' | 'group_director' | 'secretary' | 'it_team';
export type MeetingType = 'offline' | 'online' | 'miscellaneous';
export type BookingStatus = 'submitted' | 'gd_approved' | 'gd_rejected' | 'secretary_approved' | 'secretary_rejected' | 'it_setup_complete' | 'completed' | 'cancelled';

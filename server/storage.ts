import {
  users,
  venues,
  resources,
  bookings,
  feedback,
  bookingHistory,
  type User,
  type InsertUser,
  type Venue,
  type InsertVenue,
  type Booking,
  type InsertBooking,
  type BookingWithDetails,
  type Feedback,
  type InsertFeedback,
  type Resource,
  type BookingHistory,
  type InsertBookingHistory,
  type UserRole,
  type BookingStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, desc, ne } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Venue operations
  getAllVenues(): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  checkVenueAvailability(venueId: string, date: Date, startTime: string, endTime: string, excludeBookingId?: string): Promise<boolean>;

  // Resource operations
  getAllResources(): Promise<Resource[]>;
  createResource(resource: { name: string; description?: string; type: string; status: string }): Promise<Resource>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  getBookingsByUser(userId: string): Promise<BookingWithDetails[]>;
  getBookingsByStatus(status: BookingStatus): Promise<BookingWithDetails[]>;
  getBookingsByRole(role: UserRole): Promise<BookingWithDetails[]>;
  getProcessedBookingsByRole(role: UserRole): Promise<BookingWithDetails[]>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;
  updateBookingStatus(id: string, status: BookingStatus, userId: string, remarks?: string): Promise<Booking>;
  getAllBookings(): Promise<BookingWithDetails[]>;

  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedbackByBooking(bookingId: string): Promise<Feedback | undefined>;

  // Booking history operations
  addBookingHistory(history: InsertBookingHistory): Promise<BookingHistory>;
  getBookingHistory(bookingId: string): Promise<BookingHistory[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Venue operations
  async getAllVenues(): Promise<Venue[]> {
    return await db.select().from(venues);
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async createVenue(venueData: InsertVenue): Promise<Venue> {
    const sanitizedData = {
      ...venueData,
      amenities: Array.isArray(venueData.amenities) ? venueData.amenities : []
    };
    const [venue] = await db.insert(venues).values([sanitizedData]).returning();
    return venue;
  }

  async checkVenueAvailability(venueId: string, date: Date, startTime: string, endTime: string, excludeBookingId?: string): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0];
    
    let query = db.select()
      .from(bookings)
      .where(
        and(
          eq(bookings.venueId, venueId),
          eq(bookings.eventDate, date),
          or(
            and(lte(bookings.startTime, startTime), gte(bookings.endTime, startTime)),
            and(lte(bookings.startTime, endTime), gte(bookings.endTime, endTime)),
            and(gte(bookings.startTime, startTime), lte(bookings.endTime, endTime))
          ),
          or(
            eq(bookings.status, 'submitted'),
            eq(bookings.status, 'gd_approved'),
            eq(bookings.status, 'secretary_approved'),
            eq(bookings.status, 'it_setup_complete'),
            eq(bookings.status, 'completed')
          )
        )
      );

    let finalQuery = query;
    if (excludeBookingId) {
      finalQuery = db.select()
        .from(bookings)
        .where(
          and(
            eq(bookings.venueId, venueId),
            eq(bookings.eventDate, date),
            ne(bookings.id, excludeBookingId),
            or(
              and(lte(bookings.startTime, startTime), gte(bookings.endTime, startTime)),
              and(lte(bookings.startTime, endTime), gte(bookings.endTime, endTime)),
              and(gte(bookings.startTime, startTime), lte(bookings.endTime, endTime))
            ),
            or(
              eq(bookings.status, 'submitted'),
              eq(bookings.status, 'gd_approved'),
              eq(bookings.status, 'secretary_approved'),
              eq(bookings.status, 'it_setup_complete'),
              eq(bookings.status, 'completed')
            )
          )
        );
    }

    const conflictingBookings = await finalQuery;
    return conflictingBookings.length === 0;
  }

  // Resource operations
  async getAllResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }

  async createResource(resourceData: { name: string; description?: string; type: string; status: string }): Promise<Resource> {
    const [resource] = await db.insert(resources).values(resourceData).returning();
    return resource;
  }

  // Booking operations
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const sanitizedData = {
      ...bookingData,
      requestedResources: Array.isArray(bookingData.requestedResources) ? bookingData.requestedResources : []
    };
    const [booking] = await db.insert(bookings).values([sanitizedData]).returning();
    return booking;
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const result = await db.select({
      booking: bookings,
      user: users,
      venue: venues,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(venues, eq(bookings.venueId, venues.id))
    .where(eq(bookings.id, id));

    if (!result[0]) return undefined;

    return {
      ...result[0].booking,
      user: result[0].user!,
      venue: result[0].venue!,
    };
  }

  async getBookingsByUser(userId: string): Promise<BookingWithDetails[]> {
    const result = await db.select({
      booking: bookings,
      user: users,
      venue: venues,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(venues, eq(bookings.venueId, venues.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));

    return result.map(row => ({
      ...row.booking,
      user: row.user!,
      venue: row.venue!,
    }));
  }

  async getBookingsByStatus(status: BookingStatus): Promise<BookingWithDetails[]> {
    const result = await db.select({
      booking: bookings,
      user: users,
      venue: venues,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(venues, eq(bookings.venueId, venues.id))
    .where(eq(bookings.status, status))
    .orderBy(desc(bookings.createdAt));

    return result.map(row => ({
      ...row.booking,
      user: row.user!,
      venue: row.venue!,
    }));
  }

  async getBookingsByRole(role: UserRole): Promise<BookingWithDetails[]> {
    let statusFilter;
    
    switch (role) {
      case 'group_director':
        statusFilter = eq(bookings.status, 'submitted');
        break;
      case 'secretary':
        statusFilter = eq(bookings.status, 'gd_approved');
        break;
      case 'it_team':
        statusFilter = eq(bookings.status, 'secretary_approved');
        break;
      default:
        return [];
    }

    const result = await db.select({
      booking: bookings,
      user: users,
      venue: venues,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(venues, eq(bookings.venueId, venues.id))
    .where(statusFilter)
    .orderBy(desc(bookings.createdAt));

    return result.map(row => ({
      ...row.booking,
      user: row.user!,
      venue: row.venue!,
    }));
  }

  async getProcessedBookingsByRole(role: UserRole): Promise<BookingWithDetails[]> {
    let statusFilter;
    
    switch (role) {
      case 'group_director':
        // Show bookings that director has approved or rejected
        statusFilter = or(
          eq(bookings.status, 'gd_approved'),
          eq(bookings.status, 'gd_rejected'),
          eq(bookings.status, 'secretary_approved'),
          eq(bookings.status, 'secretary_rejected'),
          eq(bookings.status, 'it_setup_complete'),
          eq(bookings.status, 'completed'),
          eq(bookings.status, 'cancelled')
        );
        break;
      case 'secretary':
        // Show bookings that secretary has approved or rejected (only those that were first approved by director)
        statusFilter = or(
          eq(bookings.status, 'secretary_approved'),
          eq(bookings.status, 'secretary_rejected'),
          eq(bookings.status, 'it_setup_complete'),
          eq(bookings.status, 'completed'),
          eq(bookings.status, 'cancelled')
        );
        break;
      case 'it_team':
        // Show bookings that IT has processed (only those approved by both director and secretary)
        statusFilter = or(
          eq(bookings.status, 'it_setup_complete'),
          eq(bookings.status, 'completed'),
          eq(bookings.status, 'cancelled')
        );
        break;
      default:
        return [];
    }

    const result = await db.select({
      booking: bookings,
      user: users,
      venue: venues,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(venues, eq(bookings.venueId, venues.id))
    .where(statusFilter)
    .orderBy(desc(bookings.updatedAt));

    return result.map(row => ({
      ...row.booking,
      user: row.user!,
      venue: row.venue!,
    }));
  }

  async updateBooking(id: string, bookingData: Partial<InsertBooking>): Promise<Booking> {
    const sanitizedData = {
      ...bookingData,
      requestedResources: Array.isArray(bookingData.requestedResources) ? bookingData.requestedResources : []
    };
    const [booking] = await db.update(bookings)
      .set(sanitizedData)
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBookingStatus(id: string, status: BookingStatus, userId: string, remarks?: string): Promise<Booking> {
    const updateData: any = { status };
    
    switch (status) {
      case 'gd_approved':
      case 'gd_rejected':
        updateData.gdApprovalDate = new Date();
        updateData.gdRemarks = remarks;
        break;
      case 'secretary_approved':
      case 'secretary_rejected':
        updateData.secretaryApprovalDate = new Date();
        updateData.secretaryRemarks = remarks;
        break;
      case 'it_setup_complete':
        updateData.itSetupDate = new Date();
        updateData.itRemarks = remarks;
        break;
    }

    const [booking] = await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    // Add to history
    await this.addBookingHistory({
      bookingId: id,
      status,
      remarks,
      changedBy: userId,
    });

    return booking;
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    const result = await db.select({
      booking: bookings,
      user: users,
      venue: venues,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(venues, eq(bookings.venueId, venues.id))
    .orderBy(desc(bookings.createdAt));

    return result.map(row => ({
      ...row.booking,
      user: row.user!,
      venue: row.venue!,
    }));
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const sanitizedData = {
      ...feedbackData,
      attachments: Array.isArray(feedbackData.attachments) ? feedbackData.attachments : []
    };
    const [feedbackRecord] = await db.insert(feedback).values([sanitizedData]).returning();
    return feedbackRecord;
  }

  async getFeedbackByBooking(bookingId: string): Promise<Feedback | undefined> {
    const [feedbackRecord] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
    return feedbackRecord;
  }

  // Booking history operations
  async addBookingHistory(historyData: InsertBookingHistory): Promise<BookingHistory> {
    const [history] = await db.insert(bookingHistory).values([historyData]).returning();
    return history;
  }

  async getBookingHistory(bookingId: string): Promise<BookingHistory[]> {
    return await db.select().from(bookingHistory)
      .where(eq(bookingHistory.bookingId, bookingId))
      .orderBy(desc(bookingHistory.createdAt));
  }
}

export const storage = new DatabaseStorage();

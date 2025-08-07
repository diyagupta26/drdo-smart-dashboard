import fs from 'fs';
import path from 'path';
import type {
  User,
  InsertUser,
  Venue,
  InsertVenue,
  Booking,
  InsertBooking,
  BookingWithDetails,
  Feedback,
  InsertFeedback,
  Resource,
  BookingHistory,
  InsertBookingHistory,
  UserRole,
  BookingStatus,
} from "@shared/schema";
import { IStorage } from './storage';
import { hashPassword } from './auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const VENUES_FILE = path.join(DATA_DIR, 'venues.json');
const RESOURCES_FILE = path.join(DATA_DIR, 'resources.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData<T>(filename: string, defaultData: T[]): T[] {
  try {
    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Failed to load ${filename}:`, error);
  }
  return defaultData;
}

function saveData<T>(filename: string, data: T[]): void {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Failed to save ${filename}:`, error);
  }
}

export class PersistentStorage implements IStorage {
  private users: User[] = [];
  private venues: Venue[] = [];
  private resources: Resource[] = [];
  private bookings: Booking[] = [];
  private feedback: Feedback[] = [];
  private bookingHistory: BookingHistory[] = [];

  constructor() {
    this.loadAllData();
    this.initializeDefaultData();
  }

  private loadAllData() {
    this.users = loadData(USERS_FILE, []);
    this.venues = loadData(VENUES_FILE, []);
    this.resources = loadData(RESOURCES_FILE, []);
    this.bookings = loadData(BOOKINGS_FILE, []);
    this.feedback = loadData(FEEDBACK_FILE, []);
    this.bookingHistory = loadData(HISTORY_FILE, []);
  }

  private async initializeDefaultData() {
    if (this.users.length === 0) {
      console.log('🌱 Initializing default data...');
      
      const hashedPassword = await hashPassword('admin');
      
      // Create default users
      const defaultUsers: User[] = [
        {
          id: "1",
          username: "admin",
          email: "admin@drdo.gov.in",
          password: hashedPassword,
          firstName: "Admin",
          lastName: "Director",
          role: "group_director",
          department: "Administration",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          username: "user",
          email: "user@drdo.gov.in",
          password: hashedPassword,
          firstName: "Test",
          lastName: "User",
          role: "user",
          department: "Research & Development",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          username: "secretary",
          email: "secretary@drdo.gov.in",
          password: hashedPassword,
          firstName: "Secretary",
          lastName: "Admin",
          role: "secretary",
          department: "Administration",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          username: "itteam",
          email: "it@drdo.gov.in",
          password: hashedPassword,
          firstName: "IT",
          lastName: "Team",
          role: "it_team",
          department: "Information Technology",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Create default venues
      const defaultVenues: Venue[] = [
        {
          id: "1",
          name: "Main Auditorium",
          capacity: 500,
          floor: "Ground",
          amenities: ["AC", "Audio System", "Stage", "Advanced Lighting"],
          status: "available",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Conference Room - DRDO Main",
          capacity: 30,
          floor: "Second",
          amenities: ["AC", "Video Conference", "Smart TV"],
          status: "available",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          name: "Training Room - DRDO Lab",
          capacity: 50,
          floor: "First",
          amenities: ["AC", "Projector", "Whiteboard", "Audio System"],
          status: "available",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Create default resources
      const defaultResources: Resource[] = [
        {
          id: "1",
          name: "Projector",
          description: "High-resolution projector for presentations",
          available: true,
          createdAt: new Date(),
        },
        {
          id: "2",
          name: "Microphone System",
          description: "Wireless microphone system",
          available: true,
          createdAt: new Date(),
        },
        {
          id: "3",
          name: "Video Conference",
          description: "Video conferencing equipment",
          available: true,
          createdAt: new Date(),
        },
        {
          id: "4",
          name: "Recording Equipment",
          description: "Audio/video recording setup",
          available: true,
          createdAt: new Date(),
        },
        {
          id: "5",
          name: "Smart TV",
          description: "65-inch smart TV for presentations",
          available: true,
          createdAt: new Date(),
        },
        {
          id: "6",
          name: "Audio System",
          description: "Professional audio system",
          available: true,
          createdAt: new Date(),
        },
      ];

      this.users = defaultUsers;
      this.venues = defaultVenues;
      this.resources = defaultResources;

      this.saveAllData();
      console.log('✅ Default data initialized');
    }
  }

  private saveAllData() {
    saveData(USERS_FILE, this.users);
    saveData(VENUES_FILE, this.venues);
    saveData(RESOURCES_FILE, this.resources);
    saveData(BOOKINGS_FILE, this.bookings);
    saveData(FEEDBACK_FILE, this.feedback);
    saveData(HISTORY_FILE, this.bookingHistory);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.generateId(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    this.saveAllData();
    return user;
  }

  // Venue operations
  async getAllVenues(): Promise<Venue[]> {
    return this.venues;
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return this.venues.find(v => v.id === id);
  }

  async createVenue(venueData: InsertVenue): Promise<Venue> {
    const venue: Venue = {
      id: this.generateId(),
      ...venueData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.venues.push(venue);
    this.saveAllData();
    return venue;
  }

  async checkVenueAvailability(venueId: string, date: Date, startTime: string, endTime: string, excludeBookingId?: string): Promise<boolean> {
    const conflictingBookings = this.bookings.filter(booking => {
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      if (booking.venueId !== venueId) return false;
      if (booking.status === 'cancelled' || booking.status === 'gd_rejected' || booking.status === 'secretary_rejected') return false;
      
      const bookingDate = new Date(booking.eventDate);
      const targetDate = new Date(date);
      
      if (bookingDate.toDateString() !== targetDate.toDateString()) return false;
      
      return !(endTime <= booking.startTime || startTime >= booking.endTime);
    });
    
    return conflictingBookings.length === 0;
  }

  // Resource operations
  async getAllResources(): Promise<Resource[]> {
    return this.resources;
  }

  async createResource(resourceData: { name: string; description?: string; type: string; status: string }): Promise<Resource> {
    const resource: Resource = {
      id: this.generateId(),
      name: resourceData.name,
      description: resourceData.description,
      available: resourceData.status === 'available',
      createdAt: new Date(),
    };
    this.resources.push(resource);
    this.saveAllData();
    return resource;
  }

  // Booking operations
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      id: this.generateId(),
      ...bookingData,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.push(booking);
    
    // Add to history
    await this.addBookingHistory({
      bookingId: booking.id,
      status: 'submitted',
      remarks: 'Booking request submitted',
      changedBy: booking.userId,
    });
    
    this.saveAllData();
    return booking;
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking) return undefined;

    const user = await this.getUser(booking.userId);
    const venue = await this.getVenue(booking.venueId);

    if (!user || !venue) return undefined;

    return { ...booking, user, venue };
  }

  async getBookingsByUser(userId: string): Promise<BookingWithDetails[]> {
    const userBookings = this.bookings.filter(b => b.userId === userId);
    const result: BookingWithDetails[] = [];

    for (const booking of userBookings) {
      const user = await this.getUser(booking.userId);
      const venue = await this.getVenue(booking.venueId);
      if (user && venue) {
        result.push({ ...booking, user, venue });
      }
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBookingsByStatus(status: BookingStatus): Promise<BookingWithDetails[]> {
    const statusBookings = this.bookings.filter(b => b.status === status);
    const result: BookingWithDetails[] = [];

    for (const booking of statusBookings) {
      const user = await this.getUser(booking.userId);
      const venue = await this.getVenue(booking.venueId);
      if (user && venue) {
        result.push({ ...booking, user, venue });
      }
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBookingsByRole(role: UserRole): Promise<BookingWithDetails[]> {
    let filteredBookings: Booking[] = [];

    switch (role) {
      case 'group_director':
        filteredBookings = this.bookings.filter(b => b.status === 'submitted');
        break;
      case 'secretary':
        filteredBookings = this.bookings.filter(b => b.status === 'gd_approved');
        break;
      case 'it_team':
        filteredBookings = this.bookings.filter(b => b.status === 'secretary_approved');
        break;
      default:
        filteredBookings = [];
    }

    const result: BookingWithDetails[] = [];
    for (const booking of filteredBookings) {
      const user = await this.getUser(booking.userId);
      const venue = await this.getVenue(booking.venueId);
      if (user && venue) {
        result.push({ ...booking, user, venue });
      }
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProcessedBookingsByRole(role: UserRole): Promise<BookingWithDetails[]> {
    let filteredBookings: Booking[] = [];

    switch (role) {
      case 'group_director':
        // Show bookings that director has approved or rejected
        filteredBookings = this.bookings.filter(b => 
          ['gd_approved', 'gd_rejected', 'secretary_approved', 'secretary_rejected', 'it_setup_complete', 'completed', 'cancelled'].includes(b.status)
        );
        break;
      case 'secretary':
        // Show bookings that secretary has approved or rejected (only those that were first approved by director)
        filteredBookings = this.bookings.filter(b => 
          ['secretary_approved', 'secretary_rejected', 'it_setup_complete', 'completed', 'cancelled'].includes(b.status)
        );
        break;
      case 'it_team':
        // Show bookings that IT has processed (only those approved by both director and secretary)
        filteredBookings = this.bookings.filter(b => 
          ['it_setup_complete', 'completed', 'cancelled'].includes(b.status)
        );
        break;
      default:
        filteredBookings = [];
    }

    const result: BookingWithDetails[] = [];
    for (const booking of filteredBookings) {
      const user = await this.getUser(booking.userId);
      const venue = await this.getVenue(booking.venueId);
      if (user && venue) {
        result.push({ ...booking, user, venue });
      }
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateBooking(id: string, bookingData: Partial<InsertBooking>): Promise<Booking> {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');

    this.bookings[index] = {
      ...this.bookings[index],
      ...bookingData,
      updatedAt: new Date(),
    };

    this.saveAllData();
    return this.bookings[index];
  }

  async updateBookingStatus(id: string, status: BookingStatus, userId: string, remarks?: string): Promise<Booking> {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');

    const now = new Date();
    const updates: Partial<Booking> = {
      status,
      updatedAt: now,
    };

    // Add role-specific fields
    switch (status) {
      case 'gd_approved':
      case 'gd_rejected':
        updates.gdApprovalDate = now;
        updates.gdRemarks = remarks;
        break;
      case 'secretary_approved':
      case 'secretary_rejected':
        updates.secretaryApprovalDate = now;
        updates.secretaryRemarks = remarks;
        break;
      case 'it_setup_complete':
        updates.itSetupDate = now;
        updates.itRemarks = remarks;
        break;
    }

    this.bookings[index] = { ...this.bookings[index], ...updates };

    // Add to history
    await this.addBookingHistory({
      bookingId: id,
      status,
      remarks: remarks || `Status updated to ${status}`,
      changedBy: userId,
    });

    this.saveAllData();
    return this.bookings[index];
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    const result: BookingWithDetails[] = [];
    for (const booking of this.bookings) {
      const user = await this.getUser(booking.userId);
      const venue = await this.getVenue(booking.venueId);
      if (user && venue) {
        result.push({ ...booking, user, venue });
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const feedback: Feedback = {
      id: this.generateId(),
      ...feedbackData,
      createdAt: new Date(),
    };
    this.feedback.push(feedback);
    this.saveAllData();
    return feedback;
  }

  async getFeedbackByBooking(bookingId: string): Promise<Feedback | undefined> {
    return this.feedback.find(f => f.bookingId === bookingId);
  }

  async getFeedbackByUser(userId: string): Promise<Feedback[]> {
    return this.feedback.filter(f => f.userId === userId);
  }

  // Booking history operations
  async addBookingHistory(historyData: InsertBookingHistory): Promise<BookingHistory> {
    const history: BookingHistory = {
      id: this.generateId(),
      ...historyData,
      createdAt: new Date(),
    };
    this.bookingHistory.push(history);
    this.saveAllData();
    return history;
  }

  async getBookingHistory(bookingId: string): Promise<BookingHistory[]> {
    return this.bookingHistory
      .filter(h => h.bookingId === bookingId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const persistentStorage = new PersistentStorage();
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

// In-memory storage for development
const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@drdo.gov.in",
    password: "$2b$10$PV3IY52KyuKz8b6EMSub5OvK89sYqrK55MzyCyquCiV/rgaINb5K.", // password: "admin"
    firstName: "Admin",
    lastName: "Director",
    role: "group_director" as UserRole,
    department: "Administration",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2", 
    username: "user",
    email: "user@drdo.gov.in",
    password: "$2b$10$PV3IY52KyuKz8b6EMSub5OvK89sYqrK55MzyCyquCiV/rgaINb5K.", // password: "admin"
    firstName: "Test",
    lastName: "User",
    role: "user" as UserRole,
    department: "Research & Development",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    username: "secretary",
    email: "secretary@drdo.gov.in", 
    password: "$2b$10$PV3IY52KyuKz8b6EMSub5OvK89sYqrK55MzyCyquCiV/rgaINb5K.", // password: "admin"
    firstName: "Secretary",
    lastName: "Admin",
    role: "secretary" as UserRole,
    department: "Administration",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    username: "itteam",
    email: "it@drdo.gov.in",
    password: "$2b$10$PV3IY52KyuKz8b6EMSub5OvK89sYqrK55MzyCyquCiV/rgaINb5K.", // password: "admin"
    firstName: "IT",
    lastName: "Team",
    role: "it_team" as UserRole,
    department: "Information Technology",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const mockVenues: Venue[] = [
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
  }
];

const mockResources: Resource[] = [
  {
    id: "1",
    name: "Projector",
    type: "equipment",
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Microphone System",
    type: "equipment", 
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

let mockBookings: Booking[] = [
  {
    id: "1",
    userId: "2", // Regular user
    venueId: "1", // Main Auditorium
    eventTitle: "Annual Research Presentation",
    eventDescription: "Presentation of annual research findings and future roadmap",
    meetingType: "presentation",
    department: "Research & Development",
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    startTime: "10:00",
    endTime: "12:00",
    expectedAttendees: 150,
    requestedResources: ["Projector", "Microphone System", "Recording Equipment"],
    specialRequirements: "Need high-quality audio recording for documentation",
    status: "submitted" as BookingStatus,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    userId: "2", // Regular user
    venueId: "2", // Conference Room - DRDO Main
    eventTitle: "Project Review Meeting",
    eventDescription: "Quarterly project review with stakeholders",
    meetingType: "meeting",
    department: "Project Management",
    eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    startTime: "14:00",
    endTime: "16:00",
    expectedAttendees: 25,
    requestedResources: ["Video Conference", "Smart TV"],
    specialRequirements: "Remote participants will join via video conference",
    status: "submitted" as BookingStatus,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    userId: "2", // Regular user
    venueId: "1", // Main Auditorium
    eventTitle: "Defense Technology Seminar",
    eventDescription: "Seminar on latest defense technologies and innovations",
    meetingType: "seminar",
    department: "Technology Development",
    eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    startTime: "09:00",
    endTime: "17:00",
    expectedAttendees: 300,
    requestedResources: ["Audio System", "Stage Lighting", "Recording Equipment"],
    specialRequirements: "Full day event with lunch break, need catering arrangements",
    status: "gd_approved" as BookingStatus, // This one is approved by director, pending secretary
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    userId: "2", // Regular user
    venueId: "2", // Conference Room - DRDO Main
    eventTitle: "Strategic Planning Workshop",
    eventDescription: "Annual strategic planning session for upcoming projects",
    meetingType: "workshop",
    department: "Strategic Planning",
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    startTime: "09:00",
    endTime: "15:00",
    expectedAttendees: 20,
    requestedResources: ["Video Conference", "Smart TV", "Whiteboard"],
    specialRequirements: "Need catering for full day workshop",
    status: "gd_approved" as BookingStatus, // Also approved by director, pending secretary
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    id: "5",
    userId: "2", // Regular user
    venueId: "3", // Training Room - DRDO Lab
    eventTitle: "Technical Training Session",
    eventDescription: "Training session on new defense technologies for technical staff",
    meetingType: "training",
    department: "Technical Training",
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    startTime: "10:00",
    endTime: "16:00",
    expectedAttendees: 40,
    requestedResources: ["Projector", "Microphone System", "Video Conference", "Recording Equipment"],
    specialRequirements: "Need recording for training documentation and remote participants",
    status: "secretary_approved" as BookingStatus, // Ready for IT setup
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "6",
    userId: "2", // Regular user
    venueId: "2", // Conference Room - DRDO Main
    eventTitle: "Board Meeting",
    eventDescription: "Monthly board meeting with senior officials",
    meetingType: "meeting",
    department: "Administration",
    eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    startTime: "14:00",
    endTime: "17:00",
    expectedAttendees: 15,
    requestedResources: ["Smart TV", "Video Conference", "Audio System"],
    specialRequirements: "High priority meeting, ensure all systems are working perfectly",
    status: "secretary_approved" as BookingStatus, // Ready for IT setup
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  }
];
let mockFeedback: Feedback[] = [];
let mockBookingHistory: BookingHistory[] = [
  {
    id: "1",
    bookingId: "1",
    status: "submitted" as BookingStatus,
    remarks: "Booking request submitted for review",
    changedBy: "2",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2", 
    bookingId: "2",
    status: "submitted" as BookingStatus,
    remarks: "Booking request submitted for review",
    changedBy: "2",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    bookingId: "3",
    status: "submitted" as BookingStatus,
    remarks: "Booking request submitted for review", 
    changedBy: "2",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    bookingId: "3",
    status: "gd_approved" as BookingStatus,
    remarks: "Approved by Group Director - looks good for the seminar",
    changedBy: "1",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    bookingId: "4",
    status: "submitted" as BookingStatus,
    remarks: "Strategic planning workshop booking submitted",
    changedBy: "2",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "6",
    bookingId: "4",
    status: "gd_approved" as BookingStatus,
    remarks: "Approved by Group Director - strategic planning is important",
    changedBy: "1",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: "7",
    bookingId: "5",
    status: "submitted" as BookingStatus,
    remarks: "Technical training session booking submitted",
    changedBy: "2",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: "8",
    bookingId: "5",
    status: "gd_approved" as BookingStatus,
    remarks: "Approved by Group Director - training is essential",
    changedBy: "1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "9",
    bookingId: "5",
    status: "secretary_approved" as BookingStatus,
    remarks: "Approved by Secretary - proceed with IT setup",
    changedBy: "3",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "10",
    bookingId: "6",
    status: "submitted" as BookingStatus,
    remarks: "Board meeting booking submitted",
    changedBy: "2",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: "11",
    bookingId: "6",
    status: "gd_approved" as BookingStatus,
    remarks: "Approved by Group Director - high priority meeting",
    changedBy: "1",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "12",
    bookingId: "6",
    status: "secretary_approved" as BookingStatus,
    remarks: "Approved by Secretary - ensure perfect setup for board meeting",
    changedBy: "3",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  }
];

export const mockStorage = {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return mockUsers.find(u => u.id === id);
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    return mockUsers.find(u => u.username === username);
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    return mockUsers.find(u => u.email === email);
  },

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: String(mockUsers.length + 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsers.push(newUser);
    return newUser;
  },

  // Venue operations
  async getAllVenues(): Promise<Venue[]> {
    return mockVenues;
  },

  async getVenue(id: string): Promise<Venue | undefined> {
    return mockVenues.find(v => v.id === id);
  },

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const newVenue: Venue = {
      ...venue,
      id: String(mockVenues.length + 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockVenues.push(newVenue);
    return newVenue;
  },

  async checkVenueAvailability(venueId: string, date: Date, startTime: string, endTime: string, excludeBookingId?: string): Promise<boolean> {
    // Simple mock - always return true for now
    return true;
  },

  // Resource operations
  async getAllResources(): Promise<Resource[]> {
    return mockResources;
  },

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking: Booking = {
      ...booking,
      id: String(mockBookings.length + 1),
      status: "submitted" as BookingStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockBookings.push(newBooking);
    return newBooking;
  },

  async getBookingsByUser(userId: string): Promise<BookingWithDetails[]> {
    return mockBookings
      .filter(b => b.userId === userId)
      .map(booking => ({
        ...booking,
        user: mockUsers.find(u => u.id === booking.userId)!,
        venue: mockVenues.find(v => v.id === booking.venueId)!,
      }));
  },

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const booking = mockBookings.find(b => b.id === id);
    if (!booking) return undefined;
    
    return {
      ...booking,
      user: mockUsers.find(u => u.id === booking.userId)!,
      venue: mockVenues.find(v => v.id === booking.venueId)!,
    };
  },

  async updateBooking(id: string, data: InsertBooking): Promise<Booking> {
    const index = mockBookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');
    
    mockBookings[index] = {
      ...mockBookings[index],
      ...data,
      updatedAt: new Date(),
    };
    return mockBookings[index];
  },

  async updateBookingStatus(id: string, status: BookingStatus, changedBy: string, remarks?: string): Promise<Booking> {
    const booking = mockBookings.find(b => b.id === id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    booking.status = status;
    booking.updatedAt = new Date();
    
    // Add to booking history
    await this.addBookingHistory({
      bookingId: id,
      status,
      remarks: remarks || `Status updated to ${status}`,
      changedBy,
    });
    
    return booking;
  },

  async getBookingsByRole(role: UserRole): Promise<BookingWithDetails[]> {
    // Filter bookings based on role and status
    let filteredBookings: Booking[] = [];
    
    switch (role) {
      case 'group_director':
        // Director sees bookings that are submitted (pending director approval)
        filteredBookings = mockBookings.filter(b => b.status === 'submitted');
        break;
      case 'secretary':
        // Secretary sees bookings that are approved by director but pending secretary approval
        filteredBookings = mockBookings.filter(b => b.status === 'gd_approved');
        break;
      case 'it_team':
        // IT team sees bookings that are approved by secretary but pending IT setup
        filteredBookings = mockBookings.filter(b => b.status === 'secretary_approved');
        break;
      default:
        filteredBookings = [];
    }
    
    return filteredBookings.map(booking => ({
      ...booking,
      user: mockUsers.find(u => u.id === booking.userId)!,
      venue: mockVenues.find(v => v.id === booking.venueId)!,
    }));
  },

  async getProcessedBookingsByRole(role: UserRole): Promise<BookingWithDetails[]> {
    let filteredBookings: Booking[] = [];

    switch (role) {
      case 'group_director':
        // Show bookings that director has approved or rejected
        filteredBookings = mockBookings.filter(b => 
          ['gd_approved', 'gd_rejected', 'secretary_approved', 'secretary_rejected', 'it_setup_complete', 'completed', 'cancelled'].includes(b.status)
        );
        break;
      case 'secretary':
        // Show bookings that secretary has approved or rejected (only those that were first approved by director)
        filteredBookings = mockBookings.filter(b => 
          ['secretary_approved', 'secretary_rejected', 'it_setup_complete', 'completed', 'cancelled'].includes(b.status)
        );
        break;
      case 'it_team':
        // Show bookings that IT has processed (only those approved by both director and secretary)
        filteredBookings = mockBookings.filter(b => 
          ['it_setup_complete', 'completed', 'cancelled'].includes(b.status)
        );
        break;
      default:
        filteredBookings = [];
    }

    return filteredBookings.map(booking => ({
      ...booking,
      user: mockUsers.find(u => u.id === booking.userId)!,
      venue: mockVenues.find(v => v.id === booking.venueId)!,
    })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // Booking history operations
  async addBookingHistory(history: InsertBookingHistory): Promise<BookingHistory> {
    const newHistory: BookingHistory = {
      ...history,
      id: String(mockBookingHistory.length + 1),
      createdAt: new Date(),
    };
    mockBookingHistory.push(newHistory);
    return newHistory;
  },

  async getBookingHistory(bookingId: string): Promise<BookingHistory[]> {
    return mockBookingHistory.filter(h => h.bookingId === bookingId);
  },

  // Feedback operations
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const newFeedback: Feedback = {
      ...feedback,
      id: String(mockFeedback.length + 1),
      createdAt: new Date(),
    };
    mockFeedback.push(newFeedback);
    return newFeedback;
  },

  async getAllFeedback(): Promise<Feedback[]> {
    return mockFeedback;
  },
};
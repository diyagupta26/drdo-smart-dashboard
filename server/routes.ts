import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { persistentStorage as storage } from "./persistent-storage";
import { authenticate, authorize, generateToken, hashPassword, comparePassword, type AuthRequest } from "./auth";
import { insertUserSchema, insertBookingSchema, insertFeedbackSchema } from "@shared/schema";
import type { UserRole, BookingStatus } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(png|jpg|jpeg|pdf|ppt|pptx|mp4|mov)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// WebSocket clients store
const wsClients = new Set<WebSocket>();

function broadcastStatusUpdate(bookingId: string, status: BookingStatus) {
  const message = JSON.stringify({
    type: 'status_update',
    bookingId,
    status,
    timestamp: new Date().toISOString(),
  });

  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());
  app.use(cookieParser());

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Seed data
  await seedData();

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user);
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user);
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  });

  app.get('/api/auth/user', authenticate, (req: AuthRequest, res) => {
    const user = req.user!;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
    });
  });

  // Venue routes
  app.get('/api/venues', authenticate, async (req, res) => {
    try {
      const venues = await storage.getAllVenues();
      res.json(venues);
    } catch (error) {
      console.error('Error fetching venues:', error);
      res.status(500).json({ message: 'Failed to fetch venues' });
    }
  });

  app.post('/api/venues/check-availability', authenticate, async (req, res) => {
    try {
      const { venueId, date, startTime, endTime, excludeBookingId } = req.body;
      
      const available = await storage.checkVenueAvailability(
        venueId,
        new Date(date),
        startTime,
        endTime,
        excludeBookingId
      );
      
      res.json({ available });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ message: 'Failed to check availability' });
    }
  });

  // Resource routes
  app.get('/api/resources', authenticate, async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  });

  // Booking routes
  app.post('/api/bookings', authenticate, async (req: AuthRequest, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        eventDate: new Date(req.body.eventDate),
      });

      // Check venue availability
      const available = await storage.checkVenueAvailability(
        bookingData.venueId,
        bookingData.eventDate,
        bookingData.startTime,
        bookingData.endTime
      );

      if (!available) {
        return res.status(400).json({ message: 'Venue not available for the selected time slot' });
      }

      const booking = await storage.createBooking(bookingData);
      
      // Add initial history entry
      await storage.addBookingHistory({
        bookingId: booking.id,
        status: 'submitted',
        remarks: 'Booking request submitted',
        changedBy: req.user!.id,
      });

      // Broadcast status update
      broadcastStatusUpdate(booking.id, 'submitted');

      res.json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(400).json({ message: 'Failed to create booking' });
    }
  });

  app.get('/api/bookings/user', authenticate, async (req: AuthRequest, res) => {
    try {
      const bookings = await storage.getBookingsByUser(req.user!.id);
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.patch('/api/bookings/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      const bookingId = req.params.id;
      const existingBooking = await storage.getBooking(bookingId);
      
      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Only allow editing by owner and only if not yet approved by all levels
      if (existingBooking.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to edit this booking' });
      }

      if (!['submitted', 'gd_rejected', 'secretary_rejected'].includes(existingBooking.status)) {
        return res.status(400).json({ message: 'Booking cannot be edited at this stage' });
      }

      const updateData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        eventDate: new Date(req.body.eventDate),
      });

      // Check venue availability (excluding current booking)
      const available = await storage.checkVenueAvailability(
        updateData.venueId,
        updateData.eventDate,
        updateData.startTime,
        updateData.endTime,
        bookingId
      );

      if (!available) {
        return res.status(400).json({ message: 'Venue not available for the selected time slot' });
      }

      const updatedBooking = await storage.updateBooking(bookingId, updateData);
      
      // Add history entry for update
      await storage.addBookingHistory({
        bookingId: bookingId,
        status: 'submitted',
        remarks: 'Booking updated and resubmitted for approval',
        changedBy: req.user!.id,
      });

      // Reset status to submitted when edited
      await storage.updateBookingStatus(bookingId, 'submitted', req.user!.id, 'Booking updated');

      // Broadcast status update
      broadcastStatusUpdate(bookingId, 'submitted');

      res.json(updatedBooking);
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(400).json({ message: 'Failed to update booking' });
    }
  });

  app.get('/api/bookings/:id', authenticate, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ message: 'Failed to fetch booking' });
    }
  });

  app.get('/api/bookings/:id/history', authenticate, async (req, res) => {
    try {
      const history = await storage.getBookingHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error('Error fetching booking history:', error);
      res.status(500).json({ message: 'Failed to fetch booking history' });
    }
  });

  // Cancel booking endpoint
  app.patch('/api/bookings/:id/cancel', authenticate, async (req: AuthRequest, res) => {
    try {
      const bookingId = req.params.id;
      const user = req.user!;
      
      const existingBooking = await storage.getBooking(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Only allow cancellation by the booking owner
      if (existingBooking.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to cancel this booking' });
      }

      // Check if booking can be cancelled
      const cancellableStatuses = ['submitted', 'gd_approved', 'secretary_approved', 'gd_rejected', 'secretary_rejected'];
      if (!cancellableStatuses.includes(existingBooking.status)) {
        return res.status(400).json({ message: 'Booking cannot be cancelled at this stage' });
      }

      // Update booking status to cancelled
      await storage.updateBookingStatus(bookingId, 'cancelled', user.id, 'Booking cancelled by user');
      
      // Add history entry
      await storage.addBookingHistory({
        bookingId: bookingId,
        status: 'cancelled',
        remarks: 'Booking cancelled by user',
        changedBy: user.id,
      });

      // Broadcast status update
      broadcastStatusUpdate(bookingId, 'cancelled');

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ message: 'Failed to cancel booking' });
    }
  });

  // Admin routes for approvals
  app.get('/api/bookings/pending/director', authenticate, authorize('group_director'), async (req, res) => {
    try {
      const bookings = await storage.getBookingsByRole('group_director');
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching director bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.get('/api/bookings/pending/secretary', authenticate, authorize('secretary'), async (req, res) => {
    try {
      const bookings = await storage.getBookingsByRole('secretary');
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching secretary bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.get('/api/bookings/pending/it', authenticate, authorize('it_team'), async (req, res) => {
    try {
      const bookings = await storage.getBookingsByRole('it_team');
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching IT bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  // New endpoints for authority dashboards to see their approved/rejected operations
  app.get('/api/bookings/processed/director', authenticate, authorize('group_director'), async (req, res) => {
    try {
      const bookings = await storage.getProcessedBookingsByRole('group_director');
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching director processed bookings:', error);
      res.status(500).json({ message: 'Failed to fetch processed bookings' });
    }
  });

  app.get('/api/bookings/processed/secretary', authenticate, authorize('secretary'), async (req, res) => {
    try {
      const bookings = await storage.getProcessedBookingsByRole('secretary');
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching secretary processed bookings:', error);
      res.status(500).json({ message: 'Failed to fetch processed bookings' });
    }
  });

  app.get('/api/bookings/processed/it', authenticate, authorize('it_team'), async (req, res) => {
    try {
      const bookings = await storage.getProcessedBookingsByRole('it_team');
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching IT processed bookings:', error);
      res.status(500).json({ message: 'Failed to fetch processed bookings' });
    }
  });

  app.patch('/api/bookings/:id/status', authenticate, async (req: AuthRequest, res) => {
    try {
      const { status, remarks } = req.body;
      const bookingId = req.params.id;
      const user = req.user!;

      // Check authorization based on status
      const allowedRoles: Record<string, UserRole[]> = {
        'gd_approved': ['group_director'],
        'gd_rejected': ['group_director'],
        'secretary_approved': ['secretary'],
        'secretary_rejected': ['secretary'],
        'it_setup_complete': ['it_team'],
      };

      if (allowedRoles[status] && !allowedRoles[status].includes(user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const booking = await storage.updateBookingStatus(bookingId, status, user.id, remarks);
      
      // Broadcast status update
      broadcastStatusUpdate(bookingId, status);

      res.json(booking);
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Failed to update booking status' });
    }
  });

  // Feedback routes
  app.post('/api/feedback', authenticate, upload.array('files'), async (req: AuthRequest, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId: req.user!.id,
        overallRating: parseInt(req.body.overallRating),
      });

      // Handle file uploads
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        feedbackData.attachments = files.map(file => `/uploads/${file.filename}`);
      }

      const feedback = await storage.createFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(400).json({ message: 'Failed to create feedback' });
    }
  });

  app.get('/api/feedback/booking/:bookingId', authenticate, async (req, res) => {
    try {
      const feedback = await storage.getFeedbackByBooking(req.params.bookingId);
      res.json(feedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  });

  app.get('/api/feedback/user', authenticate, async (req: AuthRequest, res) => {
    try {
      const feedback = await storage.getFeedbackByUser(req.user!.id);
      res.json(feedback);
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    wsClients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });

  return httpServer;
}

async function seedData() {
  try {
    // Seed venues
    const existingVenues = await storage.getAllVenues();
    if (existingVenues.length === 0) {
      await Promise.all([
        storage.createVenue({
          name: "Lecture Hall - Alpha",
          capacity: 150,
          floor: "Ground",
          amenities: ["AC", "Projector", "Microphone", "Podium"],
          status: "available",
        }),
        storage.createVenue({
          name: "Lecture Hall - Beta", 
          capacity: 100,
          floor: "First",
          amenities: ["AC", "Projector", "Smart Board"],
          status: "available",
        }),
        storage.createVenue({
          name: "Main Auditorium",
          capacity: 500,
          floor: "Ground",
          amenities: ["AC", "Audio System", "Stage", "Advanced Lighting"],
          status: "available",
        }),
        storage.createVenue({
          name: "Secondary Auditorium",
          capacity: 300,
          floor: "First", 
          amenities: ["AC", "Audio System", "Projector"],
          status: "available",
        }),
        storage.createVenue({
          name: "Conference Room - DRDO Main",
          capacity: 30,
          floor: "Second",
          amenities: ["AC", "Video Conference", "Smart TV"],
          status: "available",
        }),
        storage.createVenue({
          name: "Conference Room - ARDE",
          capacity: 25,
          floor: "Third",
          amenities: ["AC", "Projector", "Conference Phone"],
          status: "available",
        }),
        storage.createVenue({
          name: "Training Hall - Tech",
          capacity: 80,
          floor: "Second",
          amenities: ["AC", "Multiple Projectors", "Computer Setup"],
          status: "available",
        }),
        storage.createVenue({
          name: "Outdoor Venue - Garden Area",
          capacity: 200,
          floor: "Ground",
          amenities: ["Tent Setup", "Sound System", "Seating Arrangement"],
          status: "available",
        }),
      ]);
      console.log('Venues seeded successfully');
    }

    // Seed IT resources
    const existingResources = await storage.getAllResources();
    if (existingResources.length === 0) {
      await Promise.all([
        storage.createResource({
          name: "Projector & Screen",
          description: "High-definition projector with large screen",
          type: "display",
          status: "available",
        }),
        storage.createResource({
          name: "Microphone System",
          description: "Wireless microphone with sound system",
          type: "audio",
          status: "available",
        }),
        storage.createResource({
          name: "Video Conference Setup",
          description: "Complete VC setup with camera, mic, and screen sharing",
          type: "communication",
          status: "available",
        }),
        storage.createResource({
          name: "Laptop/Computer",
          description: "High-performance laptop for presentations",
          type: "computing",
          status: "available",
        }),
        storage.createResource({
          name: "Extension Cables & Power",
          description: "Power extension cords and connectivity cables",
          type: "power",
          status: "available",
        }),
        storage.createResource({
          name: "Internet Connectivity",
          description: "High-speed Wi-Fi and LAN connections",
          type: "network",
          status: "available",
        }),
        storage.createResource({
          name: "Recording Equipment",
          description: "Audio/video recording setup for sessions",
          type: "recording",
          status: "available",
        }),
        storage.createResource({
          name: "Smart Board/Interactive Display",
          description: "Touch-enabled smart board for interactive sessions",
          type: "display",
          status: "available",
        }),
        storage.createResource({
          name: "Document Camera",
          description: "Overhead document camera for presentations",
          type: "display",
          status: "available",
        }),
        storage.createResource({
          name: "Technical Support",
          description: "On-site IT technical support during event",
          type: "support",
          status: "available",
        }),
      ]);
      console.log('IT Resources seeded successfully');
    }

    // Seed default users for all roles if they don't exist
    const defaultUsers = [
      { username: 'user', role: 'user' as UserRole, firstName: 'Test', lastName: 'User', department: 'Research & Development' },
      { username: 'director', role: 'group_director' as UserRole, firstName: 'Group', lastName: 'Director', department: 'Administration' },
      { username: 'secretary', role: 'secretary' as UserRole, firstName: 'Secretary', lastName: 'Admin', department: 'Administration' },
      { username: 'itadmin', role: 'it_team' as UserRole, firstName: 'IT', lastName: 'Admin', department: 'Information Technology' },
    ];

    for (const user of defaultUsers) {
      const existing = await storage.getUserByUsername(user.username);
      if (!existing) {
        const hashedPassword = await hashPassword('admin123');
        await storage.createUser({
          username: user.username,
          password: hashedPassword,
          email: `${user.username}@drdo.gov.in`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        });
      }
    }
    console.log('Admin users checked/seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

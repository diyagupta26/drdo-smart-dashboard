# Overview

This is a DRDO (Defence Research and Development Organisation) venue booking system built as a full-stack web application. The system allows users to book venues for meetings and events, with a multi-level approval workflow involving Group Directors, Secretaries, and IT team members. The application includes role-based access control, real-time status updates via WebSocket, file upload capabilities, and feedback mechanisms.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom DRDO-themed color variables
- **Build Tool**: Vite for development and production builds

The frontend follows a component-based architecture with protected routes, role-based navigation, and responsive design. The UI components are modular and reusable, following the shadcn/ui design system.

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based endpoints
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **WebSocket**: Real-time updates for booking status changes
- **File Handling**: Multer for file uploads with type validation
- **Middleware**: Custom authentication and authorization middleware

The backend implements a layered architecture with separate modules for authentication, routing, storage abstraction, and WebSocket handling.

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

The database schema includes comprehensive relationships between users, venues, bookings, resources, and feedback with proper foreign key constraints and enums for status management.

## Authentication & Authorization
- **Strategy**: JWT tokens stored in HTTP-only cookies
- **Password Security**: bcrypt for password hashing with salt rounds
- **Role-Based Access**: Four user roles (user, group_director, secretary, it_team)
- **Route Protection**: Middleware-based authentication and authorization
- **Session Management**: Token expiration and refresh handling

## Data Models & Relationships
- **Users**: Profile information with role-based permissions
- **Venues**: Meeting spaces with capacity and amenities
- **Bookings**: Event reservations with multi-stage approval workflow
- **Resources**: Additional equipment and services
- **Feedback**: User feedback system for continuous improvement
- **Booking History**: Audit trail for all booking status changes

The booking workflow follows: Submitted → GD Approved → Secretary Approved → IT Setup Complete → Completed, with rejection paths at each approval stage.

## File Management
- **Upload Handler**: Multer with configurable storage and validation
- **Supported Formats**: Images (PNG, JPG, JPEG), Documents (PDF, PPT, PPTX), Videos (MP4, MOV)
- **File Size Limits**: 100MB maximum per file
- **Storage**: Local file system with organized directory structure

## Real-time Communication
- **WebSocket Server**: Integrated with Express server for live updates
- **Event Broadcasting**: Status changes are broadcast to all connected clients
- **Client Management**: Automatic connection handling with cleanup
- **Message Format**: JSON-based message structure for different event types

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for Node.js
- **react**: Frontend UI library
- **@tanstack/react-query**: Server state management for React

## Authentication & Security
- **bcrypt**: Password hashing and comparison
- **jsonwebtoken**: JWT token generation and verification
- **cookie-parser**: HTTP cookie parsing middleware

## UI & Styling
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for React components
- **class-variance-authority**: Utility for managing component variants

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast bundler for production builds

## File Handling & Utilities
- **multer**: Multipart form data handling for file uploads
- **ws**: WebSocket implementation for real-time communication
- **react-hook-form**: Form validation and state management
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **zod**: Schema validation library
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/hooks/useWebSocket";
import { CheckCircle, Clock, AlertCircle, RefreshCw, Calendar, MapPin, Users } from "lucide-react";
import type { BookingWithDetails, BookingHistory } from "@shared/schema";

export default function TrackStatus() {
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const { isConnected, lastMessage } = useWebSocket();

  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/user"],
  });

  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery<BookingHistory[]>({
    queryKey: ["/api/bookings", selectedBookingId, "history"],
    enabled: !!selectedBookingId,
  });

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'status_update') {
      refetchBookings();
      if (selectedBookingId === lastMessage.bookingId) {
        refetchHistory();
      }
    }
  }, [lastMessage, selectedBookingId, refetchBookings, refetchHistory]);

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (status.includes('rejected')) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'gd_approved':
      case 'secretary_approved':
        return 'bg-blue-100 text-blue-800';
      case 'it_setup_complete':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'gd_rejected':
      case 'secretary_rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'gd_approved':
        return 'Director Approved';
      case 'gd_rejected':
        return 'Director Rejected';
      case 'secretary_approved':
        return 'Secretary Approved';
      case 'secretary_rejected':
        return 'Secretary Rejected';
      case 'it_setup_complete':
        return 'Setup Complete';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getTrackingSteps = () => {
    if (!selectedBooking) return [];

    const steps = [
      {
        id: 1,
        title: "Request Submitted",
        description: "Booking request submitted successfully",
        status: 'submitted',
        completed: true,
        date: selectedBooking.createdAt,
      },
      {
        id: 2,
        title: "Group Director Approval",
        description: "Awaiting review by Group Director",
        status: 'gd_approved',
        completed: ['gd_approved', 'secretary_approved', 'it_setup_complete', 'completed'].includes(selectedBooking.status),
        rejected: selectedBooking.status === 'gd_rejected',
        date: selectedBooking.gdApprovalDate,
        remarks: selectedBooking.gdRemarks,
      },
      {
        id: 3,
        title: "Secretary Approval",
        description: "Final administrative approval",
        status: 'secretary_approved',
        completed: ['secretary_approved', 'it_setup_complete', 'completed'].includes(selectedBooking.status),
        rejected: selectedBooking.status === 'secretary_rejected',
        date: selectedBooking.secretaryApprovalDate,
        remarks: selectedBooking.secretaryRemarks,
      },
      {
        id: 4,
        title: "IT Setup Confirmation",
        description: "Equipment and venue preparation",
        status: 'it_setup_complete',
        completed: ['it_setup_complete', 'completed'].includes(selectedBooking.status),
        date: selectedBooking.itSetupDate,
        remarks: selectedBooking.itRemarks,
      },
    ];

    return steps;
  };

  const getCurrentStatusMessage = () => {
    if (!selectedBooking) return null;

    const status = selectedBooking.status;
    
    switch (status) {
      case 'submitted':
        return {
          title: "Current Status: Awaiting Group Director Approval",
          description: "Your booking request is currently being reviewed by the Group Director. You will receive an email notification once the decision is made.",
          variant: "warning" as const,
        };
      case 'gd_approved':
        return {
          title: "Current Status: Awaiting Secretary Approval",
          description: "The Group Director has approved your request. It is now pending final approval from the Director's Secretary.",
          variant: "info" as const,
        };
      case 'secretary_approved':
        return {
          title: "Current Status: Awaiting IT Setup",
          description: "Your booking has been approved! The IT team is now preparing the equipment and venue setup.",
          variant: "info" as const,
        };
      case 'it_setup_complete':
        return {
          title: "Current Status: Ready for Event",
          description: "All approvals complete and IT setup is finished. Your event is ready to proceed as scheduled.",
          variant: "success" as const,
        };
      case 'completed':
        return {
          title: "Current Status: Event Completed",
          description: "Your event has been completed successfully. Please consider submitting feedback about your experience.",
          variant: "success" as const,
        };
      case 'gd_rejected':
        return {
          title: "Current Status: Rejected by Group Director",
          description: "Your booking request has been rejected by the Group Director. Please review the remarks and submit a new request if needed.",
          variant: "error" as const,
        };
      case 'secretary_rejected':
        return {
          title: "Current Status: Rejected by Secretary",
          description: "Your booking request has been rejected by the Secretary. Please review the remarks and submit a new request if needed.",
          variant: "error" as const,
        };
      default:
        return null;
    }
  };

  const statusMessage = getCurrentStatusMessage();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Track Booking Status</h1>
            <p className="text-sm text-gray-600">Monitor real-time approval progress of your booking requests</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchBookings();
                if (selectedBookingId) refetchHistory();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Booking Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Booking to Track</CardTitle>
              <CardDescription>Choose a booking request to view its detailed status</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
              ) : bookings.length === 0 ? (
                <p className="text-gray-600">No bookings found. Create a booking first to track its status.</p>
              ) : (
                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a booking to track" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{booking.eventTitle}</span>
                          <Badge className={`ml-2 ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {selectedBooking && (
            <>
              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Booking Details: #{selectedBooking.id.slice(-8)}</span>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {getStatusText(selectedBooking.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedBooking.venue.name}</p>
                        <p className="text-xs text-gray-500">Floor: {selectedBooking.venue.floor}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedBooking.eventDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedBooking.startTime} - {selectedBooking.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedBooking.expectedAttendees} attendees</p>
                        <p className="text-xs text-gray-500">{selectedBooking.meetingType} meeting</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval Progress</CardTitle>
                  <CardDescription>Real-time tracking of your booking approval workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse flex space-x-4">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {getTrackingSteps().map((step, stepIdx) => (
                          <li key={step.id}>
                            <div className="relative pb-8">
                              {stepIdx !== getTrackingSteps().length - 1 && (
                                <span
                                  className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                                    step.completed ? 'bg-green-200' : 'bg-gray-200'
                                  }`}
                                  aria-hidden="true"
                                />
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span
                                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                      step.completed 
                                        ? 'bg-green-500' 
                                        : step.rejected 
                                        ? 'bg-red-500' 
                                        : 'bg-yellow-500'
                                    }`}
                                  >
                                    {getStatusIcon(step.status, step.completed || false)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className={`text-sm ${
                                      step.completed ? 'text-gray-900' : step.rejected ? 'text-red-700' : 'text-gray-500'
                                    }`}>
                                      <span className="font-medium">{step.title}</span>
                                      {step.completed && ' - Completed'}
                                      {step.rejected && ' - Rejected'}
                                    </p>
                                    <p className="text-xs text-gray-400">{step.description}</p>
                                    {step.remarks && (
                                      <p className={`text-xs mt-1 p-2 rounded ${
                                        step.rejected ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                                      }`}>
                                        <strong>Remarks:</strong> {step.remarks}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    <time>
                                      {step.date 
                                        ? new Date(step.date).toLocaleDateString() + ' ' + new Date(step.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                        : 'Pending'
                                      }
                                    </time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Status Summary */}
              {statusMessage && (
                <Card>
                  <CardContent className="pt-6">
                    <div className={`p-4 border rounded-lg ${
                      statusMessage.variant === 'success' 
                        ? 'bg-green-50 border-green-200'
                        : statusMessage.variant === 'error'
                        ? 'bg-red-50 border-red-200'
                        : statusMessage.variant === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {statusMessage.variant === 'success' && <CheckCircle className="h-5 w-5 text-green-400" />}
                          {statusMessage.variant === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
                          {statusMessage.variant === 'warning' && <Clock className="h-5 w-5 text-yellow-400" />}
                          {statusMessage.variant === 'info' && <Clock className="h-5 w-5 text-blue-400" />}
                        </div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-medium ${
                            statusMessage.variant === 'success' 
                              ? 'text-green-800'
                              : statusMessage.variant === 'error'
                              ? 'text-red-800'
                              : statusMessage.variant === 'warning'
                              ? 'text-yellow-800'
                              : 'text-blue-800'
                          }`}>
                            {statusMessage.title}
                          </h3>
                          <div className={`mt-2 text-sm ${
                            statusMessage.variant === 'success' 
                              ? 'text-green-700'
                              : statusMessage.variant === 'error'
                              ? 'text-red-700'
                              : statusMessage.variant === 'warning'
                              ? 'text-yellow-700'
                              : 'text-blue-700'
                          }`}>
                            <p>{statusMessage.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

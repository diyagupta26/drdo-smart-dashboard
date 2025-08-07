import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, Users, Plus, Eye, MessageSquare, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BookingWithDetails } from "@shared/schema";

export default function Bookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/user"],
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking cancelled successfully",
        description: "Your booking has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel booking",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'gd_approved':
      case 'secretary_approved':
        return 'bg-blue-100 text-blue-800';
      case 'it_setup_complete':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'gd_rejected':
      case 'secretary_rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Pending Review';
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
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const canSubmitFeedback = (booking: BookingWithDetails) => {
    return booking.status === 'completed' && new Date(booking.eventDate) < new Date();
  };

  const canEditBooking = (booking: BookingWithDetails) => {
    // User can edit until approved by director, secretary, and IT team
    return booking.status === 'submitted' || booking.status === 'gd_rejected' || booking.status === 'secretary_rejected';
  };

  const canCancelBooking = (booking: BookingWithDetails) => {
    // User can cancel booking before any approval stage is complete
    const cancellableStatuses = ['submitted', 'gd_approved', 'secretary_approved', 'gd_rejected', 'secretary_rejected'];
    return cancellableStatuses.includes(booking.status);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-600">View and manage your venue booking requests</p>
          </div>
          <Link href="/user/book">
            <Button className="drdo-active hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="pt-8">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-gray-600 mb-4">You haven't made any venue bookings yet</p>
                  <Link href="/user/book">
                    <Button className="drdo-active hover:bg-blue-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Booking
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{booking.eventTitle}</CardTitle>
                        <CardDescription className="mt-1">
                          {booking.eventDescription || "No description provided"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                        <Link href="/user/track">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Track
                          </Button>
                        </Link>
                        {canEditBooking(booking) && (
                          <Link href={`/user/book?edit=${booking.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        {canSubmitFeedback(booking) && (
                          <Link href="/user/feedback">
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Feedback
                            </Button>
                          </Link>
                        )}
                        {canCancelBooking(booking) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this booking for "{booking.eventTitle}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelBookingMutation.mutate(booking.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={cancelBookingMutation.isPending}
                                >
                                  {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel Booking"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="font-medium">Venue</span>
                        </div>
                        <p className="text-sm">{booking.venue.name}</p>
                        <p className="text-xs text-gray-500">Floor: {booking.venue.floor}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">Date & Time</span>
                        </div>
                        <p className="text-sm">{new Date(booking.eventDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{booking.startTime} - {booking.endTime}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span className="font-medium">Attendees</span>
                        </div>
                        <p className="text-sm">{booking.expectedAttendees} people</p>
                        <p className="text-xs text-gray-500">{booking.meetingType} meeting</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="font-medium">Submitted</span>
                        </div>
                        <p className="text-sm">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-xs text-gray-500">{booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString() : 'N/A'}</p>
                      </div>
                    </div>

                    {booking.requestedResources && booking.requestedResources.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Requested Resources:</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.requestedResources.map((resource, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {booking.specialRequirements && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Special Requirements:</p>
                        <p className="text-sm text-gray-600">{booking.specialRequirements}</p>
                      </div>
                    )}

                    {/* Rejection Remarks */}
                    {(booking.gdRemarks && booking.status === 'gd_rejected') && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason (Director):</p>
                        <p className="text-sm text-red-700">{booking.gdRemarks}</p>
                      </div>
                    )}

                    {(booking.secretaryRemarks && booking.status === 'secretary_rejected') && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason (Secretary):</p>
                        <p className="text-sm text-red-700">{booking.secretaryRemarks}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Calendar, Clock, MapPin, Users, FileText, Eye, CheckCircle2, History } from "lucide-react";
import type { BookingWithDetails } from "@shared/schema";

export default function SecretaryApproval() {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, lastMessage } = useWebSocket();

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'booking_status_update') {
      // Refresh the pending bookings list when any booking status changes
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/pending/secretary"] });
      
      // Show toast notification for newly approved bookings
      if (lastMessage.status === 'gd_approved') {
        toast({
          title: "New Booking for Review",
          description: "A booking has been approved by the Group Director and requires your review.",
          duration: 5000,
        });
      }
    }
  }, [lastMessage, queryClient, toast]);

  const { data: pendingBookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/pending/secretary"],
  });

  const { data: processedBookings = [], isLoading: isLoadingProcessed } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/processed/secretary"],
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ bookingId, status, remarks }: { bookingId: string; status: string; remarks?: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, {
        status,
        remarks,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: `Booking ${variables.status === 'secretary_approved' ? 'approved' : 'rejected'}`,
        description: "The booking status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/pending/secretary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/processed/secretary"] });
      setIsDialogOpen(false);
      setSelectedBooking(null);
      setRemarks("");
    },
    onError: (error) => {
      toast({
        title: "Failed to update booking",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleApproval = (action: 'approve' | 'reject') => {
    if (!selectedBooking) return;

    const status = action === 'approve' ? 'secretary_approved' : 'secretary_rejected';
    approvalMutation.mutate({
      bookingId: selectedBooking.id,
      status,
      remarks: remarks.trim() || undefined,
    });
  };

  const openDialog = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setRemarks("");
    setIsDialogOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Secretary Final Approval</h1>
            <p className="text-sm text-gray-600">Final administrative approval for venue booking requests</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {pendingBookings.length} Pending
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
              <TabsTrigger value="processed">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-6">
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
          ) : pendingBookings.length === 0 ? (
            <Card>
              <CardContent className="pt-8">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-600">No pending booking requests require your final approval at this time.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center">
                          {booking.eventTitle}
                          <Badge className="ml-3 bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Director Approved
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Requested by: {booking.user.firstName} {booking.user.lastName} ({booking.user.department})
                        </CardDescription>
                        {booking.gdRemarks && (
                          <CardDescription className="mt-2 text-blue-700 bg-blue-50 p-2 rounded">
                            <strong>Director's Remarks:</strong> {booking.gdRemarks}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">Final Approval</Badge>
                        <Dialog open={isDialogOpen && selectedBooking?.id === booking.id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialog(booking)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Final Approval Review</DialogTitle>
                              <DialogDescription>
                                Provide final administrative approval for this booking request
                              </DialogDescription>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-6">
                                {/* Approval Status */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <div className="flex items-center">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                    <div>
                                      <p className="text-sm font-medium text-green-800">
                                        Group Director Approved
                                      </p>
                                      <p className="text-sm text-green-600">
                                        Approved on: {selectedBooking.gdApprovalDate ? new Date(selectedBooking.gdApprovalDate).toLocaleDateString() : 'N/A'}
                                      </p>
                                      {selectedBooking.gdRemarks && (
                                        <p className="text-sm text-green-700 mt-1">
                                          <strong>Remarks:</strong> {selectedBooking.gdRemarks}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Booking Details */}
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Event Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Title:</strong> {selectedBooking.eventTitle}</p>
                                      <p><strong>Type:</strong> {selectedBooking.meetingType}</p>
                                      <p><strong>Department:</strong> {selectedBooking.department}</p>
                                      <p><strong>Attendees:</strong> {selectedBooking.expectedAttendees}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Schedule & Venue</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Date:</strong> {new Date(selectedBooking.eventDate).toLocaleDateString()}</p>
                                      <p><strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                                      <p><strong>Venue:</strong> {selectedBooking.venue.name}</p>
                                      <p><strong>Floor:</strong> {selectedBooking.venue.floor}</p>
                                    </div>
                                  </div>
                                </div>

                                {selectedBooking.eventDescription && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                      {selectedBooking.eventDescription}
                                    </p>
                                  </div>
                                )}

                                {selectedBooking.requestedResources && selectedBooking.requestedResources.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Requested IT Resources</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedBooking.requestedResources.map((resource, index) => (
                                        <Badge key={index} variant="secondary">
                                          {resource}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {selectedBooking.specialRequirements && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Special Requirements</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                      {selectedBooking.specialRequirements}
                                    </p>
                                  </div>
                                )}

                                {/* Secretary Remarks */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Secretary Remarks (Optional)
                                  </label>
                                  <Textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add any final comments, conditions, or special instructions..."
                                    rows={3}
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={approvalMutation.isPending}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleApproval('reject')}
                                    disabled={approvalMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    {approvalMutation.isPending ? "Processing..." : "Reject"}
                                  </Button>
                                  <Button
                                    className="drdo-success hover:bg-green-600"
                                    onClick={() => handleApproval('approve')}
                                    disabled={approvalMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {approvalMutation.isPending ? "Processing..." : "Final Approve"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
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
                        <p className="text-xs text-gray-500">Capacity: {booking.venue.capacity} people</p>
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
                          <span className="font-medium">Director Approved</span>
                        </div>
                        <p className="text-sm">
                          {booking.gdApprovalDate ? new Date(booking.gdApprovalDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.gdApprovalDate ? new Date(booking.gdApprovalDate).toLocaleTimeString() : ''}
                        </p>
                      </div>
                    </div>

                    {booking.eventDescription && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {booking.eventDescription}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
            </TabsContent>
            
            <TabsContent value="processed" className="mt-6">
              {isLoadingProcessed ? (
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
              ) : processedBookings.length === 0 ? (
                <Card>
                  <CardContent className="pt-8">
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No history</h3>
                      <p className="text-gray-600">Operations you approve or reject will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {processedBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">{booking.eventTitle}</CardTitle>
                            <CardDescription className="mt-1">
                              Requested by: {booking.user.firstName} {booking.user.lastName} ({booking.user.department})
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={
                                booking.status === 'secretary_approved' ? 'bg-green-100 text-green-800' :
                                booking.status === 'secretary_rejected' ? 'bg-red-100 text-red-800' :
                                booking.status === 'it_setup_complete' ? 'bg-purple-100 text-purple-800' :
                                booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {booking.status === 'secretary_approved' ? 'Approved by You' :
                               booking.status === 'secretary_rejected' ? 'Rejected by You' :
                               booking.status === 'it_setup_complete' ? 'IT Setup Complete' :
                               booking.status === 'completed' ? 'Completed' :
                               booking.status === 'cancelled' ? 'Cancelled' :
                               booking.status}
                            </Badge>
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
                            <p className="text-xs text-gray-500">Capacity: {booking.venue.capacity} people</p>
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
                              <span className="font-medium">Processed</span>
                            </div>
                            <p className="text-sm">{booking.secretaryApprovalDate ? new Date(booking.secretaryApprovalDate).toLocaleDateString() : 'N/A'}</p>
                            <p className="text-xs text-gray-500">{booking.secretaryApprovalDate ? new Date(booking.secretaryApprovalDate).toLocaleTimeString() : 'N/A'}</p>
                          </div>
                        </div>

                        {booking.secretaryRemarks && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Your Remarks:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {booking.secretaryRemarks}
                            </p>
                          </div>
                        )}

                        {booking.gdRemarks && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Director's Remarks:</p>
                            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                              {booking.gdRemarks}
                            </p>
                          </div>
                        )}

                        {booking.eventDescription && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {booking.eventDescription}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

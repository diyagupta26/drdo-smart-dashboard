import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Calendar, Clock, MapPin, Users, Settings, Eye, CheckCircle2, AlertTriangle, History } from "lucide-react";
import type { BookingWithDetails } from "@shared/schema";

export default function ITSetup() {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [setupRemarks, setSetupRemarks] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, lastMessage } = useWebSocket();

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'booking_status_update') {
      // Refresh the pending bookings list when any booking status changes
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/pending/it"] });
      
      // Show toast notification for newly approved bookings
      if (lastMessage.status === 'secretary_approved') {
        toast({
          title: "New IT Setup Required",
          description: "A booking has been approved and requires IT setup confirmation.",
          duration: 5000,
        });
      }
    }
  }, [lastMessage, queryClient, toast]);

  const { data: pendingBookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/pending/it"],
  });

  const { data: processedBookings = [], isLoading: isLoadingProcessed } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/processed/it"],
  });

  const setupMutation = useMutation({
    mutationFn: async ({ bookingId, remarks }: { bookingId: string; remarks?: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, {
        status: 'it_setup_complete',
        remarks,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setup marked as complete",
        description: "The IT setup has been confirmed and the event is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/pending/it"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/processed/it"] });
      setIsDialogOpen(false);
      setSelectedBooking(null);
      setSetupRemarks("");
      setCheckedItems({});
    },
    onError: (error) => {
      toast({
        title: "Failed to update setup status",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSetupComplete = () => {
    if (!selectedBooking) return;

    // Check if all required items are checked
    const requiredChecks = ['venue_prepared', 'equipment_tested', 'connectivity_verified'];
    const allChecked = requiredChecks.every(item => checkedItems[item]);
    
    if (!allChecked) {
      toast({
        title: "Setup verification incomplete",
        description: "Please verify all required setup items before marking as complete.",
        variant: "destructive",
      });
      return;
    }

    setupMutation.mutate({
      bookingId: selectedBooking.id,
      remarks: setupRemarks.trim() || undefined,
    });
  };

  const openDialog = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setSetupRemarks("");
    setCheckedItems({});
    setIsDialogOpen(true);
  };

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const getSetupChecklist = (booking: BookingWithDetails) => {
    const baseItems = [
      {
        id: 'venue_prepared',
        label: 'Venue Setup Complete',
        description: 'Room is clean, arranged, and ready for the event',
        required: true,
      },
      {
        id: 'equipment_tested',
        label: 'Equipment Tested',
        description: 'All requested equipment is working properly',
        required: true,
      },
      {
        id: 'connectivity_verified',
        label: 'Connectivity Verified',
        description: 'Network, power, and AV connections are stable',
        required: true,
      },
    ];

    // Add specific items based on requested resources (case-insensitive matching)
    const resources = booking.requestedResources?.map(r => r.toLowerCase()) || [];
    
    if (resources.some(r => r.includes('projector'))) {
      baseItems.push({
        id: 'projector_setup',
        label: 'Projector Setup',
        description: 'Projector is installed and calibrated',
        required: false,
      });
    }

    if (resources.some(r => r.includes('microphone') || r.includes('audio'))) {
      baseItems.push({
        id: 'audio_setup',
        label: 'Audio System Setup',
        description: 'Microphones and speakers are tested',
        required: false,
      });
    }

    if (resources.some(r => r.includes('video conference') || r.includes('videoconference'))) {
      baseItems.push({
        id: 'vc_setup',
        label: 'Video Conference Setup',
        description: 'VC system is configured and tested',
        required: false,
      });
    }

    if (resources.some(r => r.includes('recording'))) {
      baseItems.push({
        id: 'recording_setup',
        label: 'Recording Equipment',
        description: 'Recording devices are set up and tested',
        required: false,
      });
    }

    if (resources.some(r => r.includes('smart tv') || r.includes('tv'))) {
      baseItems.push({
        id: 'display_setup',
        label: 'Display Setup',
        description: 'Smart TV and display systems are configured',
        required: false,
      });
    }

    return baseItems;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IT Setup Confirmation</h1>
            <p className="text-sm text-gray-600">Confirm equipment setup and venue preparation for approved events</p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {pendingBookings.length} Pending Setup
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending Setup</TabsTrigger>
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
                  <Settings className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All setups complete!</h3>
                  <p className="text-gray-600">No pending events require IT setup at this time.</p>
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
                            Fully Approved
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Requested by: {booking.user.firstName} {booking.user.lastName} ({booking.user.department})
                        </CardDescription>
                        <div className="mt-2 space-y-1">
                          {booking.gdRemarks && (
                            <CardDescription className="text-blue-700 bg-blue-50 p-2 rounded text-xs">
                              <strong>Director's Remarks:</strong> {booking.gdRemarks}
                            </CardDescription>
                          )}
                          {booking.secretaryRemarks && (
                            <CardDescription className="text-purple-700 bg-purple-50 p-2 rounded text-xs">
                              <strong>Secretary's Remarks:</strong> {booking.secretaryRemarks}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-orange-100 text-orange-800">Setup Required</Badge>
                        <Dialog open={isDialogOpen && selectedBooking?.id === booking.id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialog(booking)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Setup
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>IT Setup Confirmation</DialogTitle>
                              <DialogDescription>
                                Verify all equipment and venue setup for the event
                              </DialogDescription>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-6">
                                {/* Event Information */}
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Title:</strong> {selectedBooking.eventTitle}</p>
                                      <p><strong>Date:</strong> {new Date(selectedBooking.eventDate).toLocaleDateString()}</p>
                                      <p><strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                                      <p><strong>Attendees:</strong> {selectedBooking.expectedAttendees}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Venue Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Venue:</strong> {selectedBooking.venue.name}</p>
                                      <p><strong>Floor:</strong> {selectedBooking.venue.floor}</p>
                                      <p><strong>Capacity:</strong> {selectedBooking.venue.capacity} people</p>
                                      <p><strong>Amenities:</strong> {selectedBooking.venue.amenities?.join(', ') || 'None listed'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Requested Resources */}
                                {selectedBooking.requestedResources && selectedBooking.requestedResources.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Requested IT Resources</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {selectedBooking.requestedResources.map((resource, index) => (
                                        <Badge key={index} variant="outline" className="justify-start">
                                          <Settings className="w-3 h-3 mr-1" />
                                          {resource}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Special Requirements */}
                                {selectedBooking.specialRequirements && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Special Requirements</h4>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                      <div className="flex items-start">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                                        <p className="text-sm text-yellow-800">{selectedBooking.specialRequirements}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Setup Checklist */}
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-4">Setup Verification Checklist</h4>
                                  <div className="space-y-3">
                                    {getSetupChecklist(selectedBooking).map((item) => (
                                      <div key={item.id} className="flex items-start space-x-3">
                                        <Checkbox
                                          id={item.id}
                                          checked={checkedItems[item.id] || false}
                                          onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                                        />
                                        <div className="flex-1">
                                          <label
                                            htmlFor={item.id}
                                            className={`text-sm font-medium cursor-pointer ${
                                              item.required ? 'text-gray-900' : 'text-gray-700'
                                            }`}
                                          >
                                            {item.label}
                                            {item.required && <span className="text-red-500 ml-1">*</span>}
                                          </label>
                                          <p className="text-xs text-gray-500">{item.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    <span className="text-red-500">*</span> Required items must be completed before confirming setup
                                  </p>
                                </div>

                                {/* Setup Notes */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Setup Notes & Comments
                                  </label>
                                  <Textarea
                                    value={setupRemarks}
                                    onChange={(e) => setSetupRemarks(e.target.value)}
                                    placeholder="Add any setup notes, equipment serial numbers, special configurations, or additional remarks..."
                                    rows={4}
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={setupMutation.isPending}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="drdo-success hover:bg-green-600"
                                    onClick={handleSetupComplete}
                                    disabled={setupMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {setupMutation.isPending ? "Confirming..." : "Confirm Setup Complete"}
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
                          <span className="font-medium">Final Approval</span>
                        </div>
                        <p className="text-sm">
                          {booking.secretaryApprovalDate ? new Date(booking.secretaryApprovalDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.secretaryApprovalDate ? new Date(booking.secretaryApprovalDate).toLocaleTimeString() : ''}
                        </p>
                      </div>
                    </div>

                    {/* Resources Required */}
                    {booking.requestedResources && booking.requestedResources.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">IT Resources Required:</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.requestedResources.map((resource, index) => (
                            <Badge key={index} variant="outline">
                              <Settings className="w-3 h-3 mr-1" />
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {booking.specialRequirements && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Special Requirements:</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                            <p className="text-sm text-yellow-800">{booking.specialRequirements}</p>
                          </div>
                        </div>
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
                      <p className="text-gray-600">IT setups you complete will appear here.</p>
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
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Setup Complete
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
                            <p className="text-xs text-gray-500">Floor: {booking.venue.floor}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span className="font-medium">Event Date</span>
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
                              <span className="font-medium">Setup Completed</span>
                            </div>
                            <p className="text-sm">{booking.itSetupDate ? new Date(booking.itSetupDate).toLocaleDateString() : 'N/A'}</p>
                            <p className="text-xs text-gray-500">{booking.itSetupDate ? new Date(booking.itSetupDate).toLocaleTimeString() : 'N/A'}</p>
                          </div>
                        </div>

                        {booking.itRemarks && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Your Setup Notes:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {booking.itRemarks}
                            </p>
                          </div>
                        )}

                        {booking.requestedResources && booking.requestedResources.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">IT Resources Setup:</p>
                            <div className="flex flex-wrap gap-2">
                              {booking.requestedResources.map((resource, index) => (
                                <Badge key={index} variant="outline" className="bg-green-50 border-green-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                                  {resource}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {booking.eventDescription && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Event Description:</p>
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

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Upload, X, FileText, Image, Video } from "lucide-react";
import type { BookingWithDetails } from "@shared/schema";

const feedbackSchema = z.object({
  bookingId: z.string().min(1, "Please select a booking"),
  overallRating: z.number().min(1).max(5),
  venueRating: z.enum(["excellent", "good", "average", "poor"]),
  itSupportRating: z.enum(["excellent", "good", "average", "poor"]),
  feedbackText: z.string().optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function Feedback() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rating, setRating] = useState(5);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/user"],
  });

  const { data: userFeedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/feedback/user"],
  });

  // Filter completed bookings that can receive feedback (only after meeting is over)
  const completedBookings = bookings.filter(booking => {
    const eventDateTime = new Date(booking.eventDate);
    const now = new Date();
    
    // Check if the event is completed and the event date has passed
    // Also check if feedback hasn't been submitted yet
    const feedbackExists = userFeedback.some((feedback: any) => feedback.bookingId === booking.id);
    return booking.status === 'completed' && eventDateTime < now && !feedbackExists;
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: FeedbackForm & { files: File[] }) => {
      const formData = new FormData();
      formData.append('bookingId', data.bookingId);
      formData.append('overallRating', data.overallRating.toString());
      formData.append('venueRating', data.venueRating);
      formData.append('itSupportRating', data.itSupportRating);
      if (data.feedbackText) {
        formData.append('feedbackText', data.feedbackText);
      }

      // Append files
      data.files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted successfully",
        description: "Thank you for your feedback!",
      });
      reset();
      setSelectedFiles([]);
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit feedback",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      overallRating: 5,
    },
  });

  const onSubmit = (data: FeedbackForm) => {
    feedbackMutation.mutate({ ...data, files: selectedFiles });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />;
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) {
      return <Video className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submit Event Feedback</h1>
            <p className="text-sm text-gray-600">Share your experience and help us improve our services</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Previously Submitted Feedback */}
          {!feedbackLoading && userFeedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Previous Feedback</CardTitle>
                <CardDescription>Feedback you've submitted for completed events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userFeedback.map((feedback: any) => {
                    const booking = bookings.find(b => b.id === feedback.bookingId);
                    return (
                      <div key={feedback.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{booking?.eventTitle || 'Event'}</h4>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= feedback.overallRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span>Venue: {feedback.venueRating}</span> • 
                          <span> IT Support: {feedback.itSupportRating}</span> • 
                          <span> Submitted: {new Date(feedback.createdAt).toLocaleDateString()}</span>
                        </div>
                        {feedback.feedbackText && (
                          <p className="text-sm text-gray-700 italic">"{feedback.feedbackText}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Feedback Form */}
          {isLoading || feedbackLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : completedBookings.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Submit New Feedback</CardTitle>
                <CardDescription>Provide feedback for your completed events</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events available for feedback</h3>
                  <p className="text-gray-600">
                    You can submit feedback only after your events are completed and the meeting date has passed.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Feedback helps us improve our services for future events.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Booking Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Event</CardTitle>
                  <CardDescription>Choose the completed event you want to provide feedback for</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="bookingId">Event</Label>
                  <Select onValueChange={(value) => setValue("bookingId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a completed event" />
                    </SelectTrigger>
                    <SelectContent>
                      {completedBookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.eventTitle}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(booking.eventDate).toLocaleDateString()} • {booking.venue.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bookingId && (
                    <p className="text-sm text-red-600 mt-1">{errors.bookingId.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Rating Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Ratings</CardTitle>
                  <CardDescription>Rate different aspects of your event experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Rating */}
                  <div>
                    <Label>Overall Event Rating</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              setRating(star);
                              setValue("overallRating", star);
                            }}
                            className={`text-2xl transition-colors ${
                              star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-500`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({rating} out of 5 stars)</span>
                    </div>
                    {errors.overallRating && (
                      <p className="text-sm text-red-600 mt-1">{errors.overallRating.message}</p>
                    )}
                  </div>

                  {/* Venue Rating */}
                  <div>
                    <Label htmlFor="venueRating">Venue Quality</Label>
                    <Select onValueChange={(value) => setValue("venueRating", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate the venue quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.venueRating && (
                      <p className="text-sm text-red-600 mt-1">{errors.venueRating.message}</p>
                    )}
                  </div>

                  {/* IT Support Rating */}
                  <div>
                    <Label htmlFor="itSupportRating">IT Support Quality</Label>
                    <Select onValueChange={(value) => setValue("itSupportRating", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate the IT support quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.itSupportRating && (
                      <p className="text-sm text-red-600 mt-1">{errors.itSupportRating.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Feedback</CardTitle>
                  <CardDescription>Share your experience and suggestions for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="feedbackText">Comments (Optional)</Label>
                  <Textarea
                    id="feedbackText"
                    {...register("feedbackText")}
                    placeholder="Please share your experience, what went well, and any suggestions for improvement..."
                    rows={6}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Files (Optional)</CardTitle>
                  <CardDescription>Attach presentations, photos, videos, or other relevant files</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div>
                      <Label htmlFor="fileInput" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload presentations, photos, or videos
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PNG, JPG, PDF, PPT, MP4 up to 100MB
                        </span>
                      </Label>
                      <Input
                        id="fileInput"
                        type="file"
                        multiple
                        className="sr-only"
                        accept=".png,.jpg,.jpeg,.pdf,.ppt,.pptx,.mp4,.mov"
                        onChange={handleFileSelect}
                      />
                    </div>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label>Selected Files:</Label>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file.name)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Your feedback helps us improve our services.</p>
                      <p className="text-xs text-gray-500 mt-1">All feedback is kept confidential and anonymous.</p>
                    </div>
                    <Button
                      type="submit"
                      className="drdo-active hover:bg-blue-600"
                      disabled={feedbackMutation.isPending}
                    >
                      {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

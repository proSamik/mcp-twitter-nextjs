"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import {
  MessageSquare,
  Calendar,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  CalendarPlus,
  Plus,
  Video,
  Upload,
  X,
  Play,
  AlertCircle,
} from "lucide-react";
import { TweetEntity } from "@/lib/db/pg/schema.pg";
import { useTweetListWebSocket } from "@/lib/websocket/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { TweetEmbed } from "./tweet-embed";
import { SecureMediaGrid } from "@/components/ui/secure-media";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

interface MediaFile {
  file: File;
  url: string;
  type: "image" | "video";
  size: number;
  uploading?: boolean;
  uploaded?: boolean;
  uploadProgress?: number;
  r2Key?: string;
  r2Url?: string;
  error?: string;
}

interface TweetListProps {
  userId: string;
}

export function TweetList({ userId }: TweetListProps) {
  const [tweets, setTweets] = useState<TweetEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTweet, setEditingTweet] = useState<TweetEntity | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");
  const [editThreadTweets, setEditThreadTweets] = useState<string[]>([]);
  const [editMediaFiles, setEditMediaFiles] = useState<MediaFile[]>([]);
  const [_editThreadMediaFiles, setEditThreadMediaFiles] = useState<
    MediaFile[][]
  >([]);

  // Helper functions for thread management
  const updateEditThreadTweet = (index: number, content: string) => {
    setEditThreadTweets((prev) =>
      prev.map((tweet, i) => (i === index ? content : tweet)),
    );
  };

  const addEditThreadTweet = () => {
    setEditThreadTweets((prev) => [...prev, ""]);
  };

  const removeEditThreadTweet = (index: number) => {
    if (editThreadTweets.length > 1) {
      setEditThreadTweets((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Get the content to send to API
  const getFinalEditContent = () => {
    if (editingTweet?.tweetType === "thread") {
      return editThreadTweets.filter((t) => t.trim()).join("\n\n");
    }
    return editContent;
  };

  // Validate content for both single tweets and threads
  const isContentValid = () => {
    if (editingTweet?.tweetType === "thread") {
      const validTweets = editThreadTweets.filter((t) => t.trim());
      return (
        validTweets.length > 0 && validTweets.every((t) => t.length <= 280)
      );
    }
    return editContent.trim() && editContent.length <= 280;
  };

  // Media upload functions
  const uploadEditMediaFile = async (mediaFile: MediaFile, index: number) => {
    try {
      // Update file status to uploading
      setEditMediaFiles((prev) =>
        prev.map((file, i) =>
          i === index ? { ...file, uploading: true, uploadProgress: 0 } : file,
        ),
      );

      const formData = new FormData();
      formData.append("file", mediaFile.file);
      formData.append("mediaType", mediaFile.type);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setEditMediaFiles((prev) =>
          prev.map((file, i) =>
            i === index &&
            file.uploadProgress !== undefined &&
            file.uploadProgress < 90
              ? { ...file, uploadProgress: file.uploadProgress + 10 }
              : file,
          ),
        );
      }, 200);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (data.success) {
        setEditMediaFiles((prev) =>
          prev.map((file, i) =>
            i === index
              ? {
                  ...file,
                  uploading: false,
                  uploaded: true,
                  uploadProgress: 100,
                  r2Key: data.file.key,
                  r2Url: data.file.url,
                }
              : file,
          ),
        );
        toast.success(
          `${mediaFile.type === "video" ? "Video" : "Image"} uploaded successfully!`,
        );
      } else {
        setEditMediaFiles((prev) =>
          prev.map((file, i) =>
            i === index
              ? {
                  ...file,
                  uploading: false,
                  uploaded: false,
                  uploadProgress: 0,
                  error: data.error,
                }
              : file,
          ),
        );
        toast.error(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setEditMediaFiles((prev) =>
        prev.map((file, i) =>
          i === index
            ? {
                ...file,
                uploading: false,
                uploaded: false,
                uploadProgress: 0,
                error: "Upload failed",
              }
            : file,
        ),
      );
      toast.error("Failed to upload file");
    }
  };

  const removeEditMediaFile = async (index: number) => {
    const fileToRemove = editMediaFiles[index];

    // Delete from R2 if uploaded
    if (fileToRemove.uploaded && fileToRemove.r2Key) {
      try {
        await fetch("/api/media/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keys: [fileToRemove.r2Key],
          }),
        });
      } catch (error) {
        console.error("Error deleting file from R2:", error);
      }
    }

    // Revoke object URL to free memory
    URL.revokeObjectURL(fileToRemove.url);

    // Remove from state
    setEditMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const cleanupEditMediaFiles = async () => {
    const keysToDelete = editMediaFiles
      .filter((file) => file.uploaded && file.r2Key)
      .map((file) => file.r2Key!);

    if (keysToDelete.length > 0) {
      try {
        await fetch("/api/media/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keys: keysToDelete }),
        });
      } catch (error) {
        console.error("Error cleaning up media files:", error);
      }
    }

    // Revoke all object URLs
    editMediaFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setEditMediaFiles([]);
  };

  // Dropzone for media uploads
  const onDrop = async (acceptedFiles: File[]) => {
    const MAX_FILES = 4; // Twitter limit
    const currentFileCount = editMediaFiles.length;

    if (currentFileCount + acceptedFiles.length > MAX_FILES) {
      toast.error(
        `Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - currentFileCount} more.`,
      );
      return;
    }

    const newMediaFiles: MediaFile[] = acceptedFiles.map((file) => {
      const isVideo = file.type.startsWith("video/");

      return {
        file,
        url: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
        size: file.size,
        uploading: false,
        uploaded: false,
        uploadProgress: 0,
      };
    });

    setEditMediaFiles((prev) => [...prev, ...newMediaFiles]);

    // Start uploading files
    for (let i = 0; i < newMediaFiles.length; i++) {
      const mediaFile = newMediaFiles[i];
      await uploadEditMediaFile(mediaFile, currentFileCount + i);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxSize: 512 * 1024 * 1024, // 512MB
    disabled: editMediaFiles.length >= 4,
  });

  // Set up WebSocket for real-time updates
  const { setTweets: setWebSocketTweets } = useTweetListWebSocket(
    userId,
    (updatedTweets) => {
      console.log("Real-time tweet update:", updatedTweets);
      setTweets(updatedTweets);
    },
  );

  // Fetch initial tweets once, then rely on WebSocket for updates
  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/twitter/tweets");
      const data = await response.json();

      if (data.success) {
        setTweets(data.tweets);
        setWebSocketTweets(data.tweets); // Initialize WebSocket state
      } else {
        toast.error("Failed to fetch tweets");
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
      toast.error("Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/twitter/tweets?tweetId=${tweetId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tweet deleted successfully");
        // WebSocket will handle the UI update
      } else {
        toast.error(data.error || "Failed to delete tweet");
      }
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete tweet");
    }
  };

  // Handler to open edit dialog for a draft
  const handleEditDraft = (tweet: TweetEntity) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
    setScheduleDate("");
    setEditMediaFiles([]); // Clear media files
    setEditThreadMediaFiles([]); // Clear thread media files

    if (tweet.tweetType === "thread" && tweet.content) {
      // Split thread content back into individual tweets
      const threadTweets = tweet.content.split("\n\n").filter((t) => t.trim());
      setEditThreadTweets(threadTweets);
      setEditContent(""); // Clear single content for threads
    } else {
      setEditContent(tweet.content || "");
      setEditThreadTweets([]); // Clear thread tweets for single tweets
    }
  };

  // Handler to open edit dialog for a scheduled tweet
  const handleEditScheduled = (tweet: TweetEntity) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
    setEditMediaFiles([]); // Clear media files
    setEditThreadMediaFiles([]); // Clear thread media files

    if (tweet.tweetType === "thread" && tweet.content) {
      // Split thread content back into individual tweets
      const threadTweets = tweet.content.split("\n\n").filter((t) => t.trim());
      setEditThreadTweets(threadTweets);
      setEditContent(""); // Clear single content for threads
    } else {
      setEditContent(tweet.content || "");
      setEditThreadTweets([]); // Clear thread tweets for single tweets
    }

    // Pre-populate schedule date if editing a scheduled tweet
    if (tweet.scheduledFor) {
      // Convert UTC date to local datetime-local format for input field
      const utcDate = new Date(tweet.scheduledFor);
      // Convert to local time for datetime-local input
      const localISOTime = new Date(
        utcDate.getTime() - utcDate.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);
      setScheduleDate(localISOTime);
    } else {
      setScheduleDate("");
    }
  };

  // Handler to schedule a draft
  const handleScheduleDraft = async () => {
    if (!editingTweet) return;
    try {
      const mediaIds = editMediaFiles
        .filter((file) => file.uploaded)
        .map((file) => file.r2Key)
        .filter(Boolean);

      const response = await fetch("/api/twitter/tweets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweetId: editingTweet.nanoId,
          action: "schedule",
          scheduledFor: new Date(scheduleDate).toISOString(), // Convert to UTC ISO string
          content:
            getFinalEditContent() !== editingTweet.content
              ? getFinalEditContent()
              : undefined,
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
          hasMedia: mediaIds.length > 0,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Draft scheduled successfully");
        // WebSocket will handle the UI update automatically
      } else {
        toast.error(data.error || "Failed to schedule draft");
      }
    } catch (_error) {
      toast.error("Failed to schedule draft");
    } finally {
      setEditDialogOpen(false);
    }
  };

  // Handler to reschedule an existing scheduled tweet
  const handleReschedule = async () => {
    if (!editingTweet || !scheduleDate) return;

    try {
      const mediaIds = editMediaFiles
        .filter((file) => file.uploaded)
        .map((file) => file.r2Key)
        .filter(Boolean);

      const response = await fetch("/api/twitter/tweets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweetId: editingTweet.nanoId,
          action: "reschedule",
          scheduledFor: new Date(scheduleDate).toISOString(), // Convert to UTC ISO string
          content:
            getFinalEditContent() !== editingTweet.content
              ? getFinalEditContent()
              : undefined,
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
          hasMedia: mediaIds.length > 0,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Tweet rescheduled successfully");
        // WebSocket will handle the UI update automatically
      } else {
        toast.error(data.error || "Failed to reschedule tweet");
      }
    } catch (_error) {
      toast.error("Failed to reschedule tweet");
    } finally {
      setEditDialogOpen(false);
    }
  };
  // Handler to post a draft immediately
  const handlePostDraft = async () => {
    if (!editingTweet) return;
    try {
      const mediaIds = editMediaFiles
        .filter((file) => file.uploaded)
        .map((file) => file.r2Key)
        .filter(Boolean);

      const response = await fetch("/api/twitter/tweets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweetId: editingTweet.nanoId,
          action: "post",
          content:
            getFinalEditContent() !== editingTweet.content
              ? getFinalEditContent()
              : undefined,
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
          hasMedia: mediaIds.length > 0,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Draft posted successfully");
        // WebSocket will handle the UI update automatically
      } else {
        toast.error(data.error || "Failed to post draft");
      }
    } catch (_error) {
      toast.error("Failed to post draft");
    } finally {
      setEditDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <CheckCircle2 className="h-4 w-4" />;
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      case "draft":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Sort tweets by createdAt descending (newest first)
  const sortedTweets = [...tweets].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  const drafts = sortedTweets.filter((tweet) => tweet.status === "draft");
  const scheduled = sortedTweets.filter(
    (tweet) => tweet.status === "scheduled",
  );
  const posted = sortedTweets.filter((tweet) => tweet.status === "posted");

  const TweetCard = ({ tweet }: { tweet: TweetEntity }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(tweet.status)}
            <Badge className={getStatusColor(tweet.status)}>
              {tweet.status}
            </Badge>
            {tweet.tweetType === "thread" && (
              <Badge variant="outline">Thread</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {tweet.status === "posted" && tweet.twitterTweetId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    `https://twitter.com/i/web/status/${tweet.twitterTweetId}`,
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {tweet.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditDraft(tweet)}
                className="mr-1"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {tweet.status === "scheduled" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditScheduled(tweet)}
                className="mr-1"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteTweet(tweet.nanoId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Only show content for drafts and scheduled tweets, not posted ones */}
        {tweet.status !== "posted" && (
          <p className="text-sm mb-3 whitespace-pre-wrap">{tweet.content}</p>
        )}

        {/* Show media preview for drafts and scheduled tweets */}
        {(tweet.status === "draft" || tweet.status === "scheduled") &&
          tweet.mediaUrls &&
          tweet.mediaUrls.length > 0 && (
            <div className="mb-4">
              <SecureMediaGrid mediaKeys={tweet.mediaUrls} />
            </div>
          )}

        {/* Show embedded tweet for posted tweets */}
        {tweet.status === "posted" && tweet.twitterTweetId && (
          <div className="mb-4">
            <TweetEmbed
              tweetId={tweet.twitterTweetId}
              showPreview={true}
              className="mb-3"
            />
          </div>
        )}

        <div className="space-y-2">
          {tweet.hashtags && tweet.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tweet.hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {tweet.mentions && tweet.mentions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tweet.mentions.map((mention, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  @{mention}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            {tweet.createdAt && (
              <span>
                Created {format(new Date(tweet.createdAt), "MMM d, h:mm a")}
              </span>
            )}
            {tweet.scheduledFor && (
              <span>
                Scheduled for{" "}
                {format(new Date(tweet.scheduledFor), "MMM d, h:mm a")} (local)
              </span>
            )}
            {tweet.postedAt && (
              <span>
                Posted {format(new Date(tweet.postedAt), "MMM d, h:mm a")}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tweets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Your Tweets</CardTitle>
        </div>
        <CardDescription>
          Manage your drafts, scheduled tweets, and posted content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({tweets.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
            <TabsTrigger value="scheduled">
              Scheduled ({scheduled.length})
            </TabsTrigger>
            <TabsTrigger value="posted">Posted ({posted.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {sortedTweets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tweets yet. Start by composing your first tweet!</p>
              </div>
            ) : (
              sortedTweets.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4 mt-4">
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No drafts saved.</p>
              </div>
            ) : (
              drafts.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4 mt-4">
            {scheduled.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled tweets.</p>
              </div>
            ) : (
              scheduled.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>

          <TabsContent value="posted" className="space-y-4 mt-4">
            {posted.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posted tweets.</p>
              </div>
            ) : (
              posted.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Tweet Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            // Clean up media files when dialog closes
            cleanupEditMediaFiles();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTweet?.status === "draft"
                ? "Edit Draft"
                : "Edit Scheduled Tweet"}
            </DialogTitle>
            <DialogDescription>
              {editingTweet?.status === "draft"
                ? "Convert this draft to a scheduled or posted tweet."
                : "Reschedule this tweet to a new time or post it immediately."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {editingTweet?.tweetType === "thread"
                  ? "Thread Content:"
                  : "Tweet Content:"}
              </label>

              {editingTweet?.tweetType === "thread" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Thread ({editThreadTweets.length} tweets)
                    </span>
                  </div>

                  {editThreadTweets.map((tweet, index) => (
                    <div
                      key={index}
                      className="space-y-2 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Tweet {index + 1}
                        </label>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${tweet.length > 280 ? "text-red-500" : tweet.length > 260 ? "text-yellow-500" : "text-muted-foreground"}`}
                          >
                            {tweet.length}/280 chars
                          </span>
                          {editThreadTweets.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeEditThreadTweet(index)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <Textarea
                        value={tweet}
                        onChange={(e) =>
                          updateEditThreadTweet(index, e.target.value)
                        }
                        placeholder={`Tweet ${index + 1} content...`}
                        className="min-h-[80px] resize-none"
                        maxLength={280}
                      />
                      {tweet.length > 280 && (
                        <span className="text-xs text-red-500">
                          Tweet exceeds character limit
                        </span>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addEditThreadTweet}
                      className="w-full max-w-xs"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Tweet
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="What's happening?"
                    className="min-h-[100px] resize-none"
                    maxLength={280}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{editContent.length}/280 characters</span>
                    {editContent.length > 280 && (
                      <span className="text-red-500">
                        Tweet exceeds character limit
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Media Upload Section */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Media (Images & Videos)
              </label>

              {/* Dropzone */}
              {editMediaFiles.length < 4 && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? "Drop files here..."
                      : "Drag & drop media files here, or click to select"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images: up to 5MB | Videos: up to 512MB | Max 4 files
                  </p>
                </div>
              )}

              {/* Media Files Display */}
              {editMediaFiles.length > 0 && (
                <div className="grid gap-3 grid-cols-2 mt-3">
                  {editMediaFiles.map((mediaFile, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg overflow-hidden"
                    >
                      {/* Media Preview */}
                      <div className="aspect-square bg-muted relative">
                        {mediaFile.type === "video" ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-6 w-6 text-muted-foreground" />
                            <video
                              src={mediaFile.url}
                              className="absolute inset-0 w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="h-8 w-8 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <Image
                              src={mediaFile.url}
                              alt="Upload preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Upload Status */}
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground truncate">
                            {mediaFile.file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEditMediaFile(index)}
                            className="h-5 w-5 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {mediaFile.uploading && (
                          <div className="space-y-1">
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${mediaFile.uploadProgress}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Uploading... {mediaFile.uploadProgress}%
                            </p>
                          </div>
                        )}

                        {mediaFile.uploaded && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-600">
                              Uploaded
                            </span>
                          </div>
                        )}

                        {mediaFile.error && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-destructive" />
                            <span className="text-xs text-destructive">
                              {mediaFile.error}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Media Preview */}
              {editingTweet?.mediaUrls && editingTweet.mediaUrls.length > 0 && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2">
                    Existing Media:
                  </label>
                  <SecureMediaGrid mediaKeys={editingTweet.mediaUrls} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {editingTweet?.status === "draft"
                  ? "Schedule for (optional):"
                  : "New schedule time:"}
              </label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {editingTweet?.status === "scheduled" &&
              editingTweet.scheduledFor && (
                <div className="text-sm text-muted-foreground">
                  Currently scheduled for:{" "}
                  {format(
                    new Date(editingTweet.scheduledFor),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </div>
              )}

            <div className="flex gap-2 justify-end">
              {editingTweet?.status === "draft" ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={handlePostDraft}
                    disabled={!isContentValid()}
                  >
                    <Send className="h-4 w-4 mr-1" /> Post Now
                  </Button>
                  <Button
                    onClick={handleScheduleDraft}
                    disabled={!scheduleDate || !isContentValid()}
                  >
                    <CalendarPlus className="h-4 w-4 mr-1" /> Schedule
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={handlePostDraft}
                    disabled={!isContentValid()}
                  >
                    <Send className="h-4 w-4 mr-1" /> Post Now
                  </Button>
                  <Button
                    onClick={handleReschedule}
                    disabled={!scheduleDate || !isContentValid()}
                  >
                    <Clock className="h-4 w-4 mr-1" /> Reschedule
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

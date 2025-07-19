"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "ui/card";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Input } from "ui/input";
import { Badge } from "ui/badge";
import { Progress } from "ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "ui/accordion";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  Send,
  Calendar as CalendarIcon,
  Clock,
  Hash,
  AtSign,
  Plus,
  Trash2,
  Users,
  Image as ImageIcon,
  Video,
  Upload,
  X,
  Play,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTwitterWebSocket } from "@/lib/websocket/client";
import {
  TwitterAccount,
  Community,
  getCharacterCount,
  getCharacterColor,
  extractHashtags,
  extractMentions,
  validateScheduleTime,
} from "../shared/composer-utils";

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

interface MediaTweetComposerProps {
  userId?: string;
}

export function MediaTweetComposer({ userId }: MediaTweetComposerProps = {}) {
  const [content, setContent] = useState("");
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");
  const [isThread, setIsThread] = useState(false);
  const [threadTweets, setThreadTweets] = useState<string[]>([""]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [posting, setPosting] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Set up WebSocket for real-time feedback
  useTwitterWebSocket(userId || null, {
    onTweetCreated: (tweet) => {
      console.log("Real-time: Tweet created", tweet);
      if (tweet.status === "draft") {
        toast.success("Draft saved and synced!", {
          description: `Draft "${tweet.content.substring(0, 50)}..." saved successfully`,
        });
      } else if (tweet.status === "scheduled") {
        toast.success("Tweet scheduled successfully!", {
          description: `Tweet "${tweet.content.substring(0, 50)}..." scheduled via UI sync`,
        });
      }
    },
    onTweetUpdated: (tweet) => {
      console.log("Real-time: Tweet updated", tweet);
      if (tweet.status === "draft") {
        toast.success("Draft updated!", {
          description: `Draft "${tweet.content.substring(0, 50)}..." was updated`,
        });
      } else if (tweet.status === "scheduled") {
        toast.success("Tweet scheduled!", {
          description: `Tweet "${tweet.content.substring(0, 50)}..." was scheduled`,
        });
      }
    },
    onTweetDeleted: (tweetId) => {
      console.log("Real-time: Tweet deleted", tweetId);
      toast.success("Tweet deleted!", {
        description: "Tweet was deleted successfully",
      });
    },
  });

  useEffect(() => {
    fetchAccounts();
    fetchCommunities();
  }, []);

  // Fetches connected Twitter accounts from the API
  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/twitter/accounts");
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Fetches available communities from the API
  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities");
      const data = await response.json();

      if (data.success) {
        setCommunities(data.communities);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  // Handles file drop for media uploads
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const MAX_FILES = 4; // Twitter limit
      const currentFileCount = mediaFiles.length;

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

      setMediaFiles((prev) => [...prev, ...newMediaFiles]);

      // Start uploading files
      for (let i = 0; i < newMediaFiles.length; i++) {
        const mediaFile = newMediaFiles[i];
        await uploadMediaFile(mediaFile, currentFileCount + i);
      }
    },
    [mediaFiles.length],
  );

  // Uploads a media file to the server
  const uploadMediaFile = async (mediaFile: MediaFile, index: number) => {
    try {
      // Update file status to uploading
      setMediaFiles((prev) =>
        prev.map((file, i) =>
          i === index ? { ...file, uploading: true, uploadProgress: 0 } : file,
        ),
      );

      const formData = new FormData();
      formData.append("file", mediaFile.file);
      formData.append("mediaType", mediaFile.type);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setMediaFiles((prev) =>
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
        setMediaFiles((prev) =>
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
        setMediaFiles((prev) =>
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
      setMediaFiles((prev) =>
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

  // Removes a media file from the composer
  const removeMediaFile = async (index: number) => {
    const fileToRemove = mediaFiles[index];

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
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxSize: 512 * 1024 * 1024, // 512MB
    disabled: mediaFiles.length >= 4,
  });

  // Adds a new tweet to the thread
  const addThreadTweet = () => {
    setThreadTweets([...threadTweets, ""]);
  };

  // Removes a tweet from the thread
  const removeThreadTweet = (index: number) => {
    if (threadTweets.length > 1) {
      const newTweets = threadTweets.filter((_, i) => i !== index);
      setThreadTweets(newTweets);
    }
  };

  // Updates a specific tweet in the thread
  const updateThreadTweet = (index: number, value: string) => {
    const newTweets = [...threadTweets];
    newTweets[index] = value;
    setThreadTweets(newTweets);
  };

  // Cleans up media files after posting or scheduling
  const cleanupMediaFiles = async () => {
    const keysToDelete = mediaFiles
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
    mediaFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setMediaFiles([]);
  };

  // Handles posting a tweet immediately
  const handlePostNow = async () => {
    const contentToPost = isThread
      ? threadTweets.filter((t) => t.trim())
      : [content];

    if (
      contentToPost.length === 0 ||
      (!contentToPost[0].trim() && mediaFiles.length === 0)
    ) {
      toast.error("Tweet content or media is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    // Check if all media files are uploaded successfully (allow posting with uploaded files)
    const hasFailedFiles = mediaFiles.some((file) => file.error);
    if (hasFailedFiles) {
      toast.error("Please remove failed uploads before posting");
      return;
    }

    setPosting(true);
    try {
      const mediaIds = mediaFiles.map((file) => file.r2Key).filter(Boolean);

      const response = await fetch("/api/twitter/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: isThread ? null : content,
          isThread,
          threadTweets: isThread
            ? threadTweets.filter((t) => t.trim())
            : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
          mediaIds,
          hasMedia: mediaFiles.length > 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tweet posted successfully!");
        setContent("");
        setThreadTweets([""]);
        setIsThread(false);
        setSelectedCommunity("none");
        // Clean up media files after successful post
        await cleanupMediaFiles();
      } else {
        toast.error(data.error || "Failed to post tweet");
      }
    } catch (error) {
      console.error("Error posting tweet:", error);
      toast.error("Failed to post tweet");
    } finally {
      setPosting(false);
    }
  };

  // Handles scheduling a tweet for later
  const handleScheduleTweet = async () => {
    const contentToPost = isThread
      ? threadTweets.filter((t) => t.trim())
      : [content];

    if (
      contentToPost.length === 0 ||
      (!contentToPost[0].trim() && mediaFiles.length === 0)
    ) {
      toast.error("Tweet content or media is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    if (!scheduleDateTime) {
      toast.error("Please select a schedule time");
      return;
    }

    const validation = validateScheduleTime(scheduleDateTime);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Check media expiry warning for schedules > 24 hours
    if (mediaFiles.length > 0) {
      const scheduleDate = new Date(scheduleDateTime);
      const now = new Date();
      const hoursUntilSchedule =
        (scheduleDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilSchedule > 24) {
        toast.error(
          "Media files expire after 24 hours. Please schedule within 24 hours or upload media closer to posting time.",
        );
        return;
      }
    }

    // Check if all media files are uploaded successfully
    const hasFailedFiles = mediaFiles.some((file) => file.error);
    if (hasFailedFiles) {
      toast.error("Please remove failed uploads before scheduling");
      return;
    }

    setScheduling(true);
    try {
      const mediaIds = mediaFiles
        .filter((file) => file.uploaded)
        .map((file) => file.r2Key)
        .filter(Boolean);

      const response = await fetch("/api/twitter/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: isThread ? null : content,
          isThread,
          threadTweets: isThread
            ? threadTweets.filter((t) => t.trim())
            : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
          mediaIds,
          hasMedia: mediaFiles.length > 0,
          scheduledFor: scheduleDateTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const localDateTime = new Date(scheduleDateTime);
        toast.success(
          `Tweet scheduled for ${localDateTime.toLocaleDateString()} at ${localDateTime.toLocaleTimeString()}`,
        );
        setContent("");
        setThreadTweets([""]);
        setIsThread(false);
        setSelectedCommunity("none");
        setScheduleDateTime("");
        setIsScheduled(false);
        // Clean up media files after successful schedule
        await cleanupMediaFiles();
      } else {
        toast.error(data.error || "Failed to schedule tweet");
      }
    } catch (error) {
      console.error("Error scheduling tweet:", error);
      toast.error("Failed to schedule tweet");
    } finally {
      setScheduling(false);
    }
  };

  const currentContent = isThread ? threadTweets.join("\n\n") : content;
  const characterCount = getCharacterCount(currentContent);
  const hashtags = extractHashtags(currentContent);
  const mentions = extractMentions(currentContent);

  return (
    <div className="">
      {/* Composer */}
      <Card>
        <Accordion type="single" collapsible defaultValue="composer">
          <AccordionItem value="composer">
            <AccordionTrigger className="px-6 py-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-lg font-semibold">
                    Media Tweet Composer
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Create tweets with images and videos
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-6 pb-6 space-y-4">
                {/* Account Selection */}
                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account</label>
                    <Select
                      value={selectedAccount}
                      onValueChange={setSelectedAccount}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            @{account.username} ({account.displayName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Community Selection */}
                {communities.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Community (Optional)
                    </label>
                    <Select
                      value={selectedCommunity}
                      onValueChange={setSelectedCommunity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select community (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Community</SelectItem>
                        {communities.map((community) => (
                          <SelectItem
                            key={community.id}
                            value={community.communityId}
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {community.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Media Upload Area */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">
                    Media (Images & Videos)
                  </label>

                  {/* Dropzone */}
                  {mediaFiles.length < 4 && (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
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
                  {mediaFiles.length > 0 && (
                    <div className="grid gap-4 grid-cols-2">
                      {mediaFiles.map((mediaFile, index) => (
                        <div
                          key={index}
                          className="relative border rounded-lg overflow-hidden"
                        >
                          {/* Media Preview */}
                          <div className="aspect-square bg-muted relative">
                            {mediaFile.type === "video" ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-8 w-8 text-muted-foreground" />
                                <video
                                  src={mediaFile.url}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="h-12 w-12 text-white drop-shadow-lg" />
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
                                onClick={() => removeMediaFile(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            {mediaFile.uploading && (
                              <div className="space-y-1">
                                <Progress
                                  value={mediaFile.uploadProgress}
                                  className="h-1"
                                />
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
                </div>

                {/* Thread Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Compose Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={!isThread ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsThread(false);
                        setThreadTweets([""]);
                      }}
                    >
                      Single Tweet
                    </Button>
                    <Button
                      variant={isThread ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsThread(true)}
                    >
                      Thread
                    </Button>
                  </div>
                </div>

                {/* Tweet Content */}
                {!isThread ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        What&apos;s happening?
                      </label>
                      <span
                        className={`text-sm ${getCharacterColor(characterCount)}`}
                      >
                        {characterCount} chars
                      </span>
                    </div>
                    <Textarea
                      placeholder="What's happening?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Thread ({threadTweets.length} tweets)
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addThreadTweet}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tweet
                      </Button>
                    </div>
                    {threadTweets.map((tweet, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Tweet {index + 1}</label>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm ${getCharacterColor(getCharacterCount(tweet))}`}
                            >
                              {getCharacterCount(tweet)} chars
                            </span>
                            {threadTweets.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeThreadTweet(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Textarea
                          placeholder={`Tweet ${index + 1}...`}
                          value={tweet}
                          onChange={(e) =>
                            updateThreadTweet(index, e.target.value)
                          }
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Hashtags and Mentions */}
                {(hashtags.length > 0 || mentions.length > 0) && (
                  <div className="space-y-2">
                    {hashtags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        {hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {mentions.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        {mentions.map((mention, index) => (
                          <Badge key={index} variant="outline">
                            @{mention}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Scheduling Options */}
                {isScheduled && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Schedule Tweet
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm">Schedule for:</label>
                      <Input
                        type="datetime-local"
                        value={scheduleDateTime}
                        onChange={(e) => setScheduleDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    onClick={() => setIsScheduled(!isScheduled)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {isScheduled ? "Cancel Schedule" : "Schedule"}
                  </Button>

                  {isScheduled ? (
                    <Button
                      onClick={handleScheduleTweet}
                      disabled={
                        (!currentContent.trim() && mediaFiles.length === 0) ||
                        !selectedAccount ||
                        !scheduleDateTime ||
                        scheduling ||
                        mediaFiles.some((file) => file.error)
                      }
                      className="flex-1"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduling ? "Scheduling..." : "Schedule Tweet"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePostNow}
                      disabled={
                        (!currentContent.trim() && mediaFiles.length === 0) ||
                        !selectedAccount ||
                        posting ||
                        mediaFiles.some((file) => file.error)
                      }
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {posting ? "Posting..." : "Post Now"}
                    </Button>
                  )}
                </div>

                {accounts.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Please connect a Twitter account to start composing tweets
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}

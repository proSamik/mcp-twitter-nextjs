"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Save,
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

interface ThreadTweetData {
  content: string;
  mediaFiles: MediaFile[];
}

interface UploadQueueItem {
  mediaFile: MediaFile;
  index: number;
  isThread: boolean;
  tweetIndex?: number;
  mediaIndex?: number;
}

interface MediaTweetComposerProps {
  userId?: string;
}

/**
 * Queue-based upload manager to prevent race conditions
 *
 * This class ensures that media files are uploaded sequentially rather than concurrently,
 * preventing race conditions that can cause upload failures and 404 errors when
 * multiple files are uploaded simultaneously.
 *
 * Benefits:
 * - Prevents server overload from concurrent uploads
 * - Ensures consistent file storage in R2
 * - Reduces the likelihood of 404 errors during tweet scheduling
 * - Provides better error handling and retry logic
 */
class UploadQueue {
  private queue: UploadQueueItem[] = [];
  private isProcessing = false;
  private onUploadComplete: (
    item: UploadQueueItem,
    success: boolean,
    data?: any,
  ) => void;

  constructor(
    onUploadComplete: (
      item: UploadQueueItem,
      success: boolean,
      data?: any,
    ) => void,
  ) {
    this.onUploadComplete = onUploadComplete;
  }

  /**
   * Add an upload item to the queue
   */
  add(item: UploadQueueItem) {
    this.queue.push(item);
    this.processQueue();
  }

  /**
   * Process the upload queue sequentially
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      try {
        console.log(
          `Processing upload queue item: ${item.mediaFile.file.name}`,
        );
        const result = await this.uploadFile(item);
        this.onUploadComplete(item, true, result);

        // Add a small delay between uploads to prevent overwhelming the server
        if (this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Upload failed for ${item.mediaFile.file.name}:`, error);
        this.onUploadComplete(item, false, error);

        // Add a longer delay after failed uploads
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Upload a single file to the server
   */
  private async uploadFile(item: UploadQueueItem): Promise<any> {
    const formData = new FormData();
    formData.append("file", item.mediaFile.file);
    formData.append("mediaType", item.mediaFile.type);

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get current queue length
   */
  get length() {
    return this.queue.length;
  }

  /**
   * Check if queue is processing
   */
  get processing() {
    return this.isProcessing;
  }
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
  const [threadTweets, setThreadTweets] = useState<ThreadTweetData[]>([
    { content: "", mediaFiles: [] },
  ]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [posting, setPosting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [saving, setSaving] = useState(false);

  // Upload queue reference
  const uploadQueueRef = useRef<UploadQueue | null>(null);

  // Initialize upload queue
  useEffect(() => {
    uploadQueueRef.current = new UploadQueue(handleUploadComplete);
  }, []);

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

  /**
   * Handle upload completion from queue
   */
  const handleUploadComplete = useCallback(
    (item: UploadQueueItem, success: boolean, data?: any) => {
      if (success && data?.success) {
        // Update the appropriate state based on whether it's a thread or single tweet
        if (
          item.isThread &&
          item.tweetIndex !== undefined &&
          item.mediaIndex !== undefined
        ) {
          setThreadTweets((prevTweets) =>
            prevTweets.map((tweet, i) =>
              i === item.tweetIndex
                ? {
                    ...tweet,
                    mediaFiles: tweet.mediaFiles.map((file, j) =>
                      j === item.mediaIndex
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
                  }
                : tweet,
            ),
          );
        } else {
          setMediaFiles((prev) =>
            prev.map((file, i) =>
              i === item.index
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
        }

        toast.success(
          `${item.mediaFile.type === "video" ? "Video" : "Image"} uploaded successfully!`,
        );
      } else {
        // Handle upload failure
        if (
          item.isThread &&
          item.tweetIndex !== undefined &&
          item.mediaIndex !== undefined
        ) {
          setThreadTweets((prevTweets) =>
            prevTweets.map((tweet, i) =>
              i === item.tweetIndex
                ? {
                    ...tweet,
                    mediaFiles: tweet.mediaFiles.map((file, j) =>
                      j === item.mediaIndex
                        ? {
                            ...file,
                            uploading: false,
                            uploaded: false,
                            uploadProgress: 0,
                            error: "Upload failed",
                          }
                        : file,
                    ),
                  }
                : tweet,
            ),
          );
        } else {
          setMediaFiles((prev) =>
            prev.map((file, i) =>
              i === item.index
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
        }

        toast.error("Failed to upload file");
      }
    },
    [],
  );

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

      // Add files to upload queue instead of uploading immediately
      for (let i = 0; i < newMediaFiles.length; i++) {
        const mediaFile = newMediaFiles[i];
        const queueIndex = currentFileCount + i;

        // Set uploading status immediately
        setMediaFiles((prev) =>
          prev.map((file, j) =>
            j === queueIndex
              ? { ...file, uploading: true, uploadProgress: 0 }
              : file,
          ),
        );

        // Add to upload queue
        uploadQueueRef.current?.add({
          mediaFile,
          index: queueIndex,
          isThread: false,
        });
      }
    },
    [mediaFiles.length],
  );

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
    setThreadTweets([...threadTweets, { content: "", mediaFiles: [] }]);
  };

  // Removes a tweet from the thread
  const removeThreadTweet = async (index: number) => {
    if (threadTweets.length > 1) {
      // Clean up media files for the tweet being removed
      const tweetToRemove = threadTweets[index];
      if (tweetToRemove.mediaFiles.length > 0) {
        await cleanupTweetMediaFiles(tweetToRemove.mediaFiles);
      }
      const newTweets = threadTweets.filter((_, i) => i !== index);
      setThreadTweets(newTweets);
    }
  };

  // Updates a specific tweet content in the thread
  const updateThreadTweet = (index: number, value: string) => {
    const newTweets = [...threadTweets];
    newTweets[index] = { ...newTweets[index], content: value };
    setThreadTweets(newTweets);
  };

  // Updates media files for a specific tweet in the thread
  const updateThreadTweetMedia = (
    tweetIndex: number,
    mediaFiles: MediaFile[],
  ) => {
    const newTweets = [...threadTweets];
    newTweets[tweetIndex] = { ...newTweets[tweetIndex], mediaFiles };
    setThreadTweets(newTweets);
  };

  // Handles media upload for a specific tweet in the thread
  const handleTweetMediaUpload = async (tweetIndex: number, files: File[]) => {
    const tweet = threadTweets[tweetIndex];
    const MAX_FILES = 4;
    const currentFileCount = tweet.mediaFiles.length;

    if (currentFileCount + files.length > MAX_FILES) {
      toast.error(
        `Maximum ${MAX_FILES} files allowed per tweet. You can add ${MAX_FILES - currentFileCount} more.`,
      );
      return;
    }

    const newMediaFiles: MediaFile[] = files.map((file) => {
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

    // Add new files to the specific tweet
    const updatedMediaFiles = [...tweet.mediaFiles, ...newMediaFiles];
    updateThreadTweetMedia(tweetIndex, updatedMediaFiles);

    // Add files to upload queue
    for (let i = 0; i < newMediaFiles.length; i++) {
      const mediaFile = newMediaFiles[i];
      const mediaIndex = currentFileCount + i;

      // Set uploading status immediately
      setThreadTweets((prevTweets) =>
        prevTweets.map((tweet, i) =>
          i === tweetIndex
            ? {
                ...tweet,
                mediaFiles: tweet.mediaFiles.map((file, j) =>
                  j === mediaIndex
                    ? { ...file, uploading: true, uploadProgress: 0 }
                    : file,
                ),
              }
            : tweet,
        ),
      );

      // Add to upload queue
      uploadQueueRef.current?.add({
        mediaFile,
        index: mediaIndex,
        isThread: true,
        tweetIndex,
        mediaIndex,
      });
    }
  };

  // Removes a media file from a specific tweet
  const removeTweetMediaFile = async (
    tweetIndex: number,
    mediaIndex: number,
  ) => {
    const tweet = threadTweets[tweetIndex];
    const fileToRemove = tweet.mediaFiles[mediaIndex];

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

    // Remove from state using functional update
    setThreadTweets((prevTweets) =>
      prevTweets.map((tweet, i) =>
        i === tweetIndex
          ? {
              ...tweet,
              mediaFiles: tweet.mediaFiles.filter((_, j) => j !== mediaIndex),
            }
          : tweet,
      ),
    );
  };

  // Cleans up media files for a specific set of files
  const cleanupTweetMediaFiles = async (files: MediaFile[]) => {
    const keysToDelete = files
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
    files.forEach((file) => URL.revokeObjectURL(file.url));
  };

  // Cleans up media files after posting or scheduling
  const cleanupMediaFiles = async () => {
    await cleanupTweetMediaFiles(mediaFiles);
    setMediaFiles([]);
  };

  // Handles posting a tweet immediately
  const handlePostNow = async () => {
    const contentToPost = isThread
      ? threadTweets.filter((t) => t.content.trim())
      : [content];

    const hasContent = isThread
      ? contentToPost.length > 0 &&
        (contentToPost[0] as ThreadTweetData).content.trim()
      : contentToPost.length > 0 && (contentToPost[0] as string).trim();

    if (!hasContent) {
      toast.error("Tweet content is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    // Check if all media files are uploaded successfully
    let hasFailedFiles = false;
    if (isThread) {
      hasFailedFiles = threadTweets.some((tweet) =>
        tweet.mediaFiles.some((file) => file.error),
      );
    } else {
      hasFailedFiles = mediaFiles.some((file) => file.error);
    }

    if (hasFailedFiles) {
      toast.error("Please remove failed uploads before posting");
      return;
    }

    setPosting(true);
    try {
      let threadData: { content: string; mediaIds: string[] }[] | undefined;
      if (isThread) {
        threadData = threadTweets
          .filter((t) => t.content.trim())
          .map((tweet) => ({
            content: tweet.content,
            mediaIds: tweet.mediaFiles
              .map((file) => file.r2Key)
              .filter((key): key is string => Boolean(key)),
          }));
      }

      const response = await fetch("/api/twitter/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: isThread ? null : content,
          isThread,
          threadTweets: isThread ? undefined : undefined,
          threadData: isThread ? threadData : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
          mediaIds: !isThread
            ? mediaFiles
                .filter((file) => file.uploaded)
                .map((file) => file.r2Key)
                .filter(Boolean)
            : undefined,
          hasMedia: isThread
            ? threadTweets.some((t) => t.mediaFiles.length > 0)
            : mediaFiles.length > 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tweet posted successfully!");
        setContent("");
        setThreadTweets([{ content: "", mediaFiles: [] }]);
        setIsThread(false);
        setSelectedCommunity("none");
        // Clean up media files after successful post
        if (isThread) {
          for (const tweet of threadTweets) {
            await cleanupTweetMediaFiles(tweet.mediaFiles);
          }
        } else {
          await cleanupMediaFiles();
        }
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
      ? threadTweets.filter((t) => t.content.trim())
      : [content];

    const hasContent = isThread
      ? contentToPost.length > 0 &&
        (contentToPost[0] as ThreadTweetData).content.trim()
      : contentToPost.length > 0 && (contentToPost[0] as string).trim();

    if (!hasContent) {
      toast.error("Tweet content is required");
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
    const hasMedia = isThread
      ? threadTweets.some((t) => t.mediaFiles.length > 0)
      : mediaFiles.length > 0;

    if (hasMedia) {
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
    let hasFailedFiles = false;
    if (isThread) {
      hasFailedFiles = threadTweets.some((tweet) =>
        tweet.mediaFiles.some((file) => file.error),
      );
    } else {
      hasFailedFiles = mediaFiles.some((file) => file.error);
    }

    if (hasFailedFiles) {
      toast.error("Please remove failed uploads before scheduling");
      return;
    }

    setScheduling(true);
    try {
      let threadData: { content: string; mediaIds: string[] }[] | undefined;
      if (isThread) {
        threadData = threadTweets
          .filter((t) => t.content.trim())
          .map((tweet) => ({
            content: tweet.content,
            mediaIds: tweet.mediaFiles
              .map((file) => file.r2Key)
              .filter((key): key is string => Boolean(key)),
          }));
      }

      const response = await fetch("/api/twitter/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: isThread ? null : content,
          isThread,
          threadTweets: isThread ? undefined : undefined,
          threadData: isThread ? threadData : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
          mediaIds: !isThread
            ? mediaFiles
                .filter((file) => file.uploaded)
                .map((file) => file.r2Key)
                .filter(Boolean)
            : undefined,
          hasMedia: isThread
            ? threadTweets.some((t) => t.mediaFiles.length > 0)
            : mediaFiles.length > 0,
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
        setThreadTweets([{ content: "", mediaFiles: [] }]);
        setIsThread(false);
        setSelectedCommunity("none");
        setScheduleDateTime("");
        setIsScheduled(false);
        // Don't clean up media files for scheduled tweets - they're saved with the schedule
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

  const handleSaveDraft = async () => {
    const contentToSave = isThread
      ? threadTweets
          .filter((t) => t.content.trim())
          .map((t) => t.content)
          .join("\n\n")
      : content;

    if (!contentToSave.trim()) {
      toast.error("Tweet content is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    setSaving(true);
    try {
      let threadData: { content: string; mediaIds: string[] }[] | undefined;
      if (isThread) {
        threadData = threadTweets
          .filter((t) => t.content.trim() || t.mediaFiles.length > 0)
          .map((tweet) => ({
            content: tweet.content,
            mediaIds: tweet.mediaFiles
              .filter((file) => file.uploaded)
              .map((file) => file.r2Key)
              .filter((key): key is string => Boolean(key)),
          }));
      }

      const response = await fetch("/api/twitter/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: isThread ? null : content,
          isThread,
          threadTweets: isThread ? undefined : undefined,
          threadData: isThread ? threadData : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
          mediaIds: !isThread
            ? mediaFiles
                .filter((file) => file.uploaded)
                .map((file) => file.r2Key)
                .filter(Boolean)
            : undefined,
          hasMedia: isThread
            ? threadTweets.some((t) => t.mediaFiles.length > 0)
            : mediaFiles.length > 0,
          saveDraft: true,
          status: "draft",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Draft saved successfully!");
        setContent("");
        setThreadTweets([{ content: "", mediaFiles: [] }]);
        setMediaFiles([]);
        setSelectedCommunity("none");
        // Don't clean up media files for drafts - they're saved with the draft
      } else {
        toast.error(data.error || "Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const currentContent = isThread
    ? threadTweets.map((t) => t.content).join("\n\n")
    : content;

  // Check if any media is currently uploading
  const hasUploadingMedia = isThread
    ? threadTweets.some((t) => t.mediaFiles.some((f) => f.uploading))
    : mediaFiles.some((file) => file.uploading);

  // Check queue status
  const isQueueProcessing = uploadQueueRef.current?.processing || false;
  const queueLength = uploadQueueRef.current?.length || 0;

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
                  <div className="text-lg font-semibold">Tweet Composer</div>
                  <div className="text-sm text-muted-foreground">
                    Create tweets with optional media (images and videos)
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

                {/* Media Upload Area - Only for single tweets */}
                {!isThread && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium">
                      Media (Images & Videos)
                    </label>

                    {/* Upload Queue Status */}
                    {(isQueueProcessing || queueLength > 0) && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-sm text-muted-foreground">
                          {isQueueProcessing
                            ? `Processing uploads... (${queueLength} remaining)`
                            : `${queueLength} files queued for upload`}
                        </span>
                      </div>
                    )}

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
                      <div
                        className={`grid gap-2 ${
                          mediaFiles.length === 1
                            ? "grid-cols-1 max-w-md"
                            : mediaFiles.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-2 md:grid-cols-3"
                        }`}
                      >
                        {mediaFiles.map((mediaFile, index) => (
                          <div
                            key={index}
                            className="relative border rounded-lg overflow-hidden"
                          >
                            {/* Media Preview */}
                            <div
                              className={`bg-muted relative ${
                                mediaFiles.length === 1
                                  ? "aspect-[16/10] max-h-80"
                                  : "aspect-video max-h-32"
                              }`}
                            >
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
                )}

                {/* Thread Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Compose Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={!isThread ? "default" : "outline"}
                      size="sm"
                      onClick={async () => {
                        setIsThread(false);
                        // Clear thread media when switching to single tweet mode
                        for (const tweet of threadTweets) {
                          if (tweet.mediaFiles.length > 0) {
                            await cleanupTweetMediaFiles(tweet.mediaFiles);
                          }
                        }
                        setThreadTweets([{ content: "", mediaFiles: [] }]);
                      }}
                    >
                      Single Tweet
                    </Button>
                    <Button
                      variant={isThread ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsThread(true);
                        // Clear single tweet media when switching to thread mode
                        if (mediaFiles.length > 0) {
                          cleanupMediaFiles();
                        }
                      }}
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
                    </div>
                    {threadTweets.map((tweet, tweetIndex) => (
                      <div
                        key={tweetIndex}
                        className="space-y-4 p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Tweet {tweetIndex + 1}
                          </label>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm ${getCharacterColor(getCharacterCount(tweet.content))}`}
                            >
                              {getCharacterCount(tweet.content)} chars
                            </span>
                            {threadTweets.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeThreadTweet(tweetIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Thread Upload Queue Status */}
                        {tweet.mediaFiles.some((f) => f.uploading) && (
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
                            <span>Processing media uploads...</span>
                          </div>
                        )}

                        <div
                          className="relative"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const target = e.currentTarget.querySelector(
                              ".drag-overlay",
                            ) as HTMLElement;
                            if (target) target.style.opacity = "1";
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Only hide if we're leaving the container, not child elements
                            if (
                              !e.currentTarget.contains(e.relatedTarget as Node)
                            ) {
                              const target = e.currentTarget.querySelector(
                                ".drag-overlay",
                              ) as HTMLElement;
                              if (target) target.style.opacity = "0";
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const target = e.currentTarget.querySelector(
                              ".drag-overlay",
                            ) as HTMLElement;
                            if (target) target.style.opacity = "0";

                            const files = Array.from(e.dataTransfer.files);
                            const imageAndVideoFiles = files.filter(
                              (file) =>
                                file.type.startsWith("image/") ||
                                file.type.startsWith("video/"),
                            );

                            if (imageAndVideoFiles.length > 0) {
                              handleTweetMediaUpload(
                                tweetIndex,
                                imageAndVideoFiles,
                              );
                            }
                          }}
                        >
                          <Textarea
                            placeholder={`Tweet ${tweetIndex + 1} content...`}
                            value={tweet.content}
                            onChange={(e) =>
                              updateThreadTweet(tweetIndex, e.target.value)
                            }
                            className="min-h-[100px] resize-none"
                          />
                          {/* Drag overlay */}
                          <div className="drag-overlay absolute inset-0 pointer-events-none opacity-0 transition-opacity bg-primary/10 border-2 border-dashed border-primary rounded-md flex items-center justify-center text-sm text-primary font-medium">
                            <div className="bg-background/90 px-3 py-2 rounded-md">
                              <ImageIcon className="h-4 w-4 inline mr-2" />
                              Drop images here
                            </div>
                          </div>
                        </div>

                        {/* Add Image Button - Compact */}
                        {tweet.mediaFiles.length < 4 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*,video/*";
                              input.multiple = true;
                              input.onchange = (e) => {
                                const files = Array.from(
                                  (e.target as HTMLInputElement).files || [],
                                );
                                handleTweetMediaUpload(tweetIndex, files);
                              };
                              input.click();
                            }}
                            className="w-full justify-start text-muted-foreground hover:text-primary"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add Media{" "}
                            {tweet.mediaFiles.length > 0 &&
                              `(${tweet.mediaFiles.length}/4)`}
                          </Button>
                        )}

                        {/* Images Display - Compact grid below content */}
                        {tweet.mediaFiles.length > 0 && (
                          <div className="grid gap-2 grid-cols-2 mt-2">
                            {tweet.mediaFiles.map((mediaFile, mediaIndex) => (
                              <div
                                key={mediaIndex}
                                className="relative border rounded-lg overflow-hidden group"
                              >
                                {/* Media Preview */}
                                <div className="aspect-video bg-muted relative max-h-32">
                                  {mediaFile.type === "video" ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <video
                                        src={mediaFile.url}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        muted
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Play className="h-6 w-6 text-white drop-shadow-lg" />
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

                                  {/* Remove button overlay */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeTweetMediaFile(
                                        tweetIndex,
                                        mediaIndex,
                                      )
                                    }
                                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Upload Status Bar */}
                                {mediaFile.uploading && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                                    <Progress
                                      value={mediaFile.uploadProgress}
                                      className="h-1"
                                    />
                                  </div>
                                )}

                                {mediaFile.error && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 p-1 flex items-center gap-1 justify-center">
                                    <AlertCircle className="h-3 w-3 text-white" />
                                    <span className="text-xs text-white">
                                      Failed
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Add Tweet Button - moved to bottom */}
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addThreadTweet}
                        className="w-full max-w-xs"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tweet
                      </Button>
                    </div>
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
                    onClick={handleSaveDraft}
                    variant="outline"
                    disabled={
                      !currentContent.trim() ||
                      !selectedAccount ||
                      saving ||
                      hasUploadingMedia ||
                      (isThread
                        ? threadTweets.some((t) =>
                            t.mediaFiles.some((f) => f.error),
                          )
                        : mediaFiles.some((file) => file.error))
                    }
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Draft"}
                  </Button>

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
                        !currentContent.trim() ||
                        !selectedAccount ||
                        !scheduleDateTime ||
                        scheduling ||
                        hasUploadingMedia ||
                        (isThread
                          ? threadTweets.some((t) =>
                              t.mediaFiles.some((f) => f.error),
                            )
                          : mediaFiles.some((file) => file.error))
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
                        !currentContent.trim() ||
                        !selectedAccount ||
                        posting ||
                        hasUploadingMedia ||
                        (isThread
                          ? threadTweets.some((t) =>
                              t.mediaFiles.some((f) => f.error),
                            )
                          : mediaFiles.some((file) => file.error))
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

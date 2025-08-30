"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { Input } from "ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  Send,
  CalendarPlus,
  Clock,
  Plus,
  Trash2,
  Upload,
  X,
  Play,
  AlertCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { TweetEntity } from "@/lib/db/pg/schema.pg";
import { format } from "date-fns";
import { SecureMediaGrid } from "@/components/ui/secure-media";
import { Community } from "./shared/composer-utils";

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

interface MediaTweetEditorProps {
  tweet: TweetEntity;
  onUpdate: () => void;
  onCancel: () => void;
}

export function MediaTweetEditor({
  tweet,
  onUpdate,
  onCancel,
}: MediaTweetEditorProps) {
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");
  const [editThreadTweets, setEditThreadTweets] = useState<
    { content: string; mediaFiles: MediaFile[] }[]
  >([]);
  const [editMediaFiles, setEditMediaFiles] = useState<MediaFile[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");

  // Initialize form data when component mounts or tweet changes
  useEffect(() => {
    if (tweet) {
      setEditMediaFiles([]); // Clear media files

      if (tweet.tweetType === "thread") {
        // Check if we have structured threadTweets data
        if (tweet.threadTweets && tweet.threadTweets.length > 0) {
          // Use structured thread data
          setEditThreadTweets(
            tweet.threadTweets.map((threadTweet: any) => ({
              content: threadTweet.content,
              mediaFiles: [], // Media files will be reconstructed from r2Keys if needed
            })),
          );
        } else {
          // Fallback: parse content by splitting on double newlines
          const threadContents = tweet.content
            ? tweet.content.split("\\n\\n")
            : [""];
          setEditThreadTweets(
            threadContents.map((content: string) => ({
              content,
              mediaFiles: [],
            })),
          );
        }
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

      // Initialize community selection
      setSelectedCommunity(tweet.communityId || "none");
    }
  }, [tweet]);

  // Load communities on component mount
  useEffect(() => {
    if (tweet?.twitterAccountId) {
      fetchCommunities(tweet.twitterAccountId);
    }
  }, [tweet?.twitterAccountId]);

  const fetchCommunities = async (twitterAccountId: string) => {
    try {
      const response = await fetch(
        `/api/twitter/communities?twitterAccountId=${twitterAccountId}`,
      );
      const data = await response.json();

      if (data.success) {
        setCommunities(data.communities || []);
      } else {
        console.error("Failed to fetch communities:", data.error);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  // Helper functions for thread management
  const updateEditThreadTweet = (index: number, content: string) => {
    setEditThreadTweets((prev) =>
      prev.map((tweet, i) => (i === index ? { ...tweet, content } : tweet)),
    );
  };

  const addEditThreadTweet = () => {
    setEditThreadTweets((prev) => [...prev, { content: "", mediaFiles: [] }]);
  };

  const updateEditThreadTweetMedia = (
    tweetIndex: number,
    mediaFiles: MediaFile[],
  ) => {
    setEditThreadTweets((prev) =>
      prev.map((tweet, i) =>
        i === tweetIndex ? { ...tweet, mediaFiles } : tweet,
      ),
    );
  };

  const handleEditTweetMediaUpload = async (
    tweetIndex: number,
    files: File[],
  ) => {
    const tweetData = editThreadTweets[tweetIndex];
    const MAX_FILES = 4;
    const currentFileCount = tweetData.mediaFiles.length;

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
    const updatedMediaFiles = [...tweetData.mediaFiles, ...newMediaFiles];
    updateEditThreadTweetMedia(tweetIndex, updatedMediaFiles);

    // Start uploading files
    for (let i = 0; i < newMediaFiles.length; i++) {
      const mediaFile = newMediaFiles[i];
      await uploadEditTweetMediaFile(
        tweetIndex,
        currentFileCount + i,
        mediaFile,
      );
    }
  };

  const uploadEditTweetMediaFile = async (
    tweetIndex: number,
    mediaIndex: number,
    mediaFile: MediaFile,
  ) => {
    try {
      // Update file status to uploading
      setEditThreadTweets((prevTweets) =>
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

      const formData = new FormData();
      formData.append("file", mediaFile.file);
      formData.append("mediaType", mediaFile.type);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setEditThreadTweets((prevTweets) =>
          prevTweets.map((tweet, i) =>
            i === tweetIndex
              ? {
                  ...tweet,
                  mediaFiles: tweet.mediaFiles.map((file, j) =>
                    j === mediaIndex &&
                    file.uploadProgress !== undefined &&
                    file.uploadProgress < 90
                      ? { ...file, uploadProgress: file.uploadProgress + 10 }
                      : file,
                  ),
                }
              : tweet,
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
        setEditThreadTweets((prevTweets) =>
          prevTweets.map((tweet, i) =>
            i === tweetIndex
              ? {
                  ...tweet,
                  mediaFiles: tweet.mediaFiles.map((file, j) =>
                    j === mediaIndex
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
        toast.success(
          `${mediaFile.type === "video" ? "Video" : "Image"} uploaded successfully!`,
        );
      } else {
        setEditThreadTweets((prevTweets) =>
          prevTweets.map((tweet, i) =>
            i === tweetIndex
              ? {
                  ...tweet,
                  mediaFiles: tweet.mediaFiles.map((file, j) =>
                    j === mediaIndex
                      ? {
                          ...file,
                          uploading: false,
                          uploaded: false,
                          uploadProgress: 0,
                          error: data.error,
                        }
                      : file,
                  ),
                }
              : tweet,
          ),
        );
        toast.error(
          `Failed to upload ${mediaFile.type === "video" ? "video" : "image"}`,
        );
      }
    } catch (error) {
      console.error("Error uploading media file:", error);
      setEditThreadTweets((prevTweets) =>
        prevTweets.map((tweet, i) =>
          i === tweetIndex
            ? {
                ...tweet,
                mediaFiles: tweet.mediaFiles.map((file, j) =>
                  j === mediaIndex
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
      toast.error("Failed to upload media file");
    }
  };

  const removeEditTweetMediaFile = (tweetIndex: number, mediaIndex: number) => {
    const tweetData = editThreadTweets[tweetIndex];
    const fileToRemove = tweetData.mediaFiles[mediaIndex];

    // Clean up blob URL
    if (fileToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(fileToRemove.url);
    }

    const updatedMediaFiles = tweetData.mediaFiles.filter(
      (_, i) => i !== mediaIndex,
    );
    updateEditThreadTweetMedia(tweetIndex, updatedMediaFiles);
  };

  const removeEditThreadTweet = (index: number) => {
    if (editThreadTweets.length > 1) {
      // Clean up media files for the tweet being removed
      const tweetToRemove = editThreadTweets[index];
      if (tweetToRemove.mediaFiles.length > 0) {
        tweetToRemove.mediaFiles.forEach((mediaFile) => {
          if (mediaFile.url.startsWith("blob:")) {
            URL.revokeObjectURL(mediaFile.url);
          }
        });
      }

      setEditThreadTweets((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Get the content to send to API
  const getFinalEditContent = () => {
    if (tweet?.tweetType === "thread") {
      return editThreadTweets
        .filter((t) => t.content.trim())
        .map((t) => t.content)
        .join("\n\n");
    }
    return editContent;
  };

  // Get thread data with media files for API
  const getThreadDataForAPI = () => {
    if (tweet?.tweetType === "thread") {
      return editThreadTweets
        .filter((t) => t.content.trim())
        .map((tweetData) => ({
          content: tweetData.content,
          mediaIds: tweetData.mediaFiles
            .filter((file) => file.uploaded && file.r2Key)
            .map((file) => file.r2Key)
            .filter((key): key is string => Boolean(key)),
        }));
    }
    return undefined;
  };

  // Check if any thread tweets have failed media uploads
  const hasFailedMediaUploads = () => {
    if (tweet?.tweetType === "thread") {
      return editThreadTweets.some((tweetData) =>
        tweetData.mediaFiles.some((file) => file.error),
      );
    }
    return editMediaFiles.some((file) => file.error);
  };

  // Check if any media files are still uploading
  const hasUploadingMedia = () => {
    if (tweet?.tweetType === "thread") {
      return editThreadTweets.some((tweetData) =>
        tweetData.mediaFiles.some((file) => file.uploading),
      );
    }
    return editMediaFiles.some((file) => file.uploading);
  };

  // Validate content for both single tweets and threads
  const isContentValid = () => {
    if (tweet?.tweetType === "thread") {
      const validTweets = editThreadTweets.filter((t) => t.content.trim());
      return (
        validTweets.length > 0 &&
        validTweets.every((t) => t.content.length <= 280) &&
        !hasFailedMediaUploads()
      );
    }
    return (
      editContent.trim() &&
      editContent.length <= 280 &&
      !hasFailedMediaUploads()
    );
  };

  // Media upload functions for single tweets
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

  // Dropzone for media uploads
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
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
    },
    [editMediaFiles.length],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxSize: 512 * 1024 * 1024, // 512MB
    disabled: editMediaFiles.length >= 4,
  });

  // Handler to schedule a draft
  const handleScheduleDraft = async () => {
    if (!tweet || isScheduling) return;

    // Check for failed uploads
    if (hasFailedMediaUploads()) {
      toast.error("Please remove failed uploads before scheduling");
      return;
    }

    // Check for uploading media
    if (hasUploadingMedia()) {
      toast.error("Please wait for media uploads to complete");
      return;
    }

    setIsScheduling(true);
    try {
      const requestBody: any = {
        tweetId: tweet.nanoId,
        action: "schedule",
        scheduledFor: scheduleDate, // Send raw datetime string
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        communityId: selectedCommunity === "none" ? null : selectedCommunity,
      };

      // Handle content changes
      if (getFinalEditContent() !== tweet.content) {
        requestBody.content = getFinalEditContent();
      }

      if (tweet.tweetType === "thread") {
        // For thread tweets, include threadData with media
        const threadData = getThreadDataForAPI();
        if (threadData && threadData.length > 0) {
          requestBody.threadData = threadData;
          requestBody.isThread = true;
          requestBody.hasMedia = threadData.some((t) => t.mediaIds.length > 0);
        }
      } else {
        // For single tweets, include mediaIds
        const mediaIds = editMediaFiles
          .filter((file) => file.uploaded)
          .map((file) => file.r2Key)
          .filter(Boolean);

        if (mediaIds.length > 0) {
          requestBody.mediaIds = mediaIds;
          requestBody.hasMedia = true;
        }
      }

      const response = await fetch("/api/twitter/tweets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Draft scheduled successfully");
        onUpdate();
      } else {
        toast.error(data.error || "Failed to schedule draft");
      }
    } catch (_error) {
      toast.error("Failed to schedule draft");
    } finally {
      setIsScheduling(false);
    }
  };

  // Handler to reschedule an existing scheduled tweet
  const handleReschedule = async () => {
    if (!tweet || !scheduleDate || isRescheduling) return;

    // Check for failed uploads
    if (hasFailedMediaUploads()) {
      toast.error("Please remove failed uploads before rescheduling");
      return;
    }

    // Check for uploading media
    if (hasUploadingMedia()) {
      toast.error("Please wait for media uploads to complete");
      return;
    }

    setIsRescheduling(true);
    try {
      const requestBody: any = {
        tweetId: tweet.nanoId,
        action: "reschedule",
        scheduledFor: scheduleDate, // Send raw datetime string
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        communityId: selectedCommunity === "none" ? null : selectedCommunity,
      };

      // Handle content changes
      if (getFinalEditContent() !== tweet.content) {
        requestBody.content = getFinalEditContent();
      }

      if (tweet.tweetType === "thread") {
        // For thread tweets, include threadData with media
        const threadData = getThreadDataForAPI();
        if (threadData && threadData.length > 0) {
          requestBody.threadData = threadData;
          requestBody.isThread = true;
          requestBody.hasMedia = threadData.some((t) => t.mediaIds.length > 0);
        }
      } else {
        // For single tweets, include mediaIds
        const mediaIds = editMediaFiles
          .filter((file) => file.uploaded)
          .map((file) => file.r2Key)
          .filter(Boolean);

        if (mediaIds.length > 0) {
          requestBody.mediaIds = mediaIds;
          requestBody.hasMedia = true;
        }
      }

      const response = await fetch("/api/twitter/tweets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Tweet rescheduled successfully");
        onUpdate();
      } else {
        toast.error(data.error || "Failed to reschedule tweet");
      }
    } catch (_error) {
      toast.error("Failed to reschedule tweet");
    } finally {
      setIsRescheduling(false);
    }
  };

  // Handler to post a draft immediately
  const handlePostDraft = async () => {
    if (!tweet || isPosting) return;

    // Check for failed uploads
    if (hasFailedMediaUploads()) {
      toast.error("Please remove failed uploads before posting");
      return;
    }

    // Check for uploading media
    if (hasUploadingMedia()) {
      toast.error("Please wait for media uploads to complete");
      return;
    }

    setIsPosting(true);
    try {
      const requestBody: any = {
        tweetId: tweet.nanoId,
        action: "post",
        communityId: selectedCommunity === "none" ? null : selectedCommunity,
      };

      // Handle content changes
      if (getFinalEditContent() !== tweet.content) {
        requestBody.content = getFinalEditContent();
      }

      if (tweet.tweetType === "thread") {
        // For thread tweets, include threadData with media
        const threadData = getThreadDataForAPI();
        if (threadData && threadData.length > 0) {
          requestBody.threadData = threadData;
          requestBody.isThread = true;
          requestBody.hasMedia = threadData.some((t) => t.mediaIds.length > 0);
        }
      } else {
        // For single tweets, include mediaIds
        const mediaIds = editMediaFiles
          .filter((file) => file.uploaded)
          .map((file) => file.r2Key)
          .filter(Boolean);

        if (mediaIds.length > 0) {
          requestBody.mediaIds = mediaIds;
          requestBody.hasMedia = true;
        }
      }

      const response = await fetch("/api/twitter/tweets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Draft posted successfully");
        onUpdate();
      } else {
        toast.error(data.error || "Failed to post draft");
      }
    } catch (_error) {
      toast.error("Failed to post draft");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {tweet?.tweetType === "thread" ? "Thread Content:" : "Tweet Content:"}
        </label>

        {tweet?.tweetType === "thread" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Thread ({editThreadTweets.length} tweets)
              </span>
            </div>

            {editThreadTweets.map((tweetData, index) => (
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
                      className={`text-xs ${tweetData.content.length > 280 ? "text-red-500" : tweetData.content.length > 260 ? "text-yellow-500" : "text-muted-foreground"}`}
                    >
                      {tweetData.content.length}/280 chars
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
                  value={tweetData.content}
                  onChange={(e) => updateEditThreadTweet(index, e.target.value)}
                  placeholder={`Tweet ${index + 1} content...`}
                  className="min-h-[80px] resize-none"
                />

                {/* Media Upload for this tweet */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Media for Tweet {index + 1}
                  </label>

                  {/* Add Media Button */}
                  {tweetData.mediaFiles.length < 4 && (
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
                          if (files.length > 0) {
                            handleEditTweetMediaUpload(index, files);
                          }
                        };
                        input.click();
                      }}
                      className="w-full justify-start text-muted-foreground hover:text-primary"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Media{" "}
                      {tweetData.mediaFiles.length > 0 &&
                        `(${tweetData.mediaFiles.length}/4)`}
                    </Button>
                  )}

                  {/* Media Files Display */}
                  {tweetData.mediaFiles.length > 0 && (
                    <div className="grid gap-2 grid-cols-2">
                      {tweetData.mediaFiles.map((mediaFile, mediaIndex) => (
                        <div
                          key={mediaIndex}
                          className="relative border rounded-lg overflow-hidden"
                        >
                          <div className="aspect-video bg-muted relative">
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
                          </div>

                          {/* Upload Status and Remove Button */}
                          <div className="absolute top-1 right-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                removeEditTweetMediaFile(index, mediaIndex)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Upload Progress */}
                          {mediaFile.uploading && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                              <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{
                                    width: `${mediaFile.uploadProgress}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-white mt-1">
                                Uploading... {mediaFile.uploadProgress}%
                              </p>
                            </div>
                          )}

                          {/* Upload Status */}
                          {mediaFile.uploaded && (
                            <div className="absolute bottom-1 left-1">
                              <div className="flex items-center gap-1 bg-green-500/90 text-white px-2 py-1 rounded text-xs">
                                <div className="h-2 w-2 bg-white rounded-full" />
                                Uploaded
                              </div>
                            </div>
                          )}

                          {mediaFile.error && (
                            <div className="absolute bottom-1 left-1">
                              <div className="flex items-center gap-1 bg-destructive/90 text-white px-2 py-1 rounded text-xs">
                                <AlertCircle className="h-3 w-3" />
                                Error
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Existing Media Preview for Thread Tweet */}
                  {tweet?.threadTweets?.[index]?.mediaIds &&
                    tweet.threadTweets[index].mediaIds.length > 0 && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-2">
                          Existing Media for Tweet {index + 1}:
                        </label>
                        <SecureMediaGrid
                          mediaKeys={tweet.threadTweets[index].mediaIds}
                        />
                      </div>
                    )}
                </div>
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
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{editContent.length} characters</span>
            </div>
          </>
        )}
      </div>

      {/* Media Upload Section for single tweets */}
      {tweet?.tweetType !== "thread" && (
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
                        <span className="text-xs text-green-600">Uploaded</span>
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
          {tweet?.mediaUrls && tweet.mediaUrls.length > 0 && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-2">
                Existing Media:
              </label>
              <SecureMediaGrid mediaKeys={tweet.mediaUrls} />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {tweet?.status === "draft"
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

      {tweet?.status === "scheduled" && tweet.scheduledFor && (
        <div className="text-sm text-muted-foreground">
          Currently scheduled for:{" "}
          {format(new Date(tweet.scheduledFor), "MMM d, yyyy 'at' h:mm a")}
        </div>
      )}

      {/* Community Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Community (optional):</label>
        <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
          <SelectTrigger>
            <SelectValue placeholder="Select community (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Community</SelectItem>
            {communities.length > 0 ? (
              communities.map((community) => (
                <SelectItem key={community.id} value={community.communityId}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{community.name}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>
                Loading communities...
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isScheduling || isRescheduling || isPosting}
        >
          Cancel
        </Button>
        {tweet?.status === "draft" ? (
          <>
            <Button
              variant="secondary"
              onClick={handlePostDraft}
              disabled={
                !isContentValid() ||
                hasUploadingMedia() ||
                isPosting ||
                isScheduling
              }
            >
              <Send className="h-4 w-4 mr-1" />
              {isPosting ? "Posting..." : "Post Now"}
            </Button>
            <Button
              onClick={handleScheduleDraft}
              disabled={
                !scheduleDate ||
                !isContentValid() ||
                hasUploadingMedia() ||
                isScheduling ||
                isPosting
              }
            >
              <CalendarPlus className="h-4 w-4 mr-1" />
              {isScheduling ? "Scheduling..." : "Schedule"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handlePostDraft}
              disabled={
                !isContentValid() ||
                hasUploadingMedia() ||
                isPosting ||
                isRescheduling
              }
            >
              <Send className="h-4 w-4 mr-1" />
              {isPosting ? "Posting..." : "Post Now"}
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={
                !scheduleDate ||
                !isContentValid() ||
                hasUploadingMedia() ||
                isRescheduling ||
                isPosting
              }
            >
              <Clock className="h-4 w-4 mr-1" />
              {isRescheduling ? "Rescheduling..." : "Reschedule"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

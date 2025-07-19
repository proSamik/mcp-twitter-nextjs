import { getR2Client } from "@/lib/r2/client";

/**
 * Process R2 media keys and convert them to Twitter media IDs
 */
export class MediaProcessor {
  private r2Client = getR2Client();

  /**
   * Convert R2 keys to Twitter media IDs
   */
  async processMediaForTwitter(
    r2Keys: string[],
    twitterClient: any,
  ): Promise<string[]> {
    const twitterMediaIds: string[] = [];

    for (const r2Key of r2Keys) {
      try {
        console.log(`Processing media file: ${r2Key}`);

        // Download file from R2
        const fileBuffer = await this.downloadFromR2(r2Key);
        console.log(
          `Downloaded file from R2: ${r2Key}, size: ${fileBuffer.length} bytes`,
        );

        // Get file info to determine media type
        const mediaType = this.getMediaTypeFromKey(r2Key);
        console.log(`File info:`, {
          r2Key,
          mediaType,
          bufferSize: fileBuffer.length,
        });

        // Upload to Twitter
        let twitterMediaId: string;

        if (mediaType.startsWith("video/")) {
          // Use chunked upload for videos
          console.log(`Uploading video to Twitter: ${mediaType}`);
          twitterMediaId = await twitterClient.uploadLargeVideo(
            fileBuffer,
            mediaType,
          );
        } else {
          // Use simple upload for images
          console.log(`Uploading image to Twitter: ${mediaType}`);
          twitterMediaId = await twitterClient.uploadMedia(
            fileBuffer,
            mediaType as any,
          );
        }

        twitterMediaIds.push(twitterMediaId);
        console.log(
          `Successfully processed media: ${r2Key} → ${twitterMediaId}`,
        );
      } catch (error) {
        console.error(`Failed to process media ${r2Key}:`, error);
        throw new Error(
          `Failed to process media ${r2Key}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return twitterMediaIds;
  }

  /**
   * Download file from R2 storage
   */
  private async downloadFromR2(key: string): Promise<Buffer> {
    try {
      // Get presigned URL for download
      const presignedUrl = await this.r2Client.getPresignedUrl(key, 300); // 5 minutes

      // Download the file
      const response = await fetch(presignedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file from R2: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Error downloading from R2:", error);
      throw new Error(
        `Failed to download from R2: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Determine media type from R2 key
   */
  private getMediaTypeFromKey(key: string): string {
    const extension = key.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      case "mp4":
        return "video/mp4";
      case "mov":
        return "video/mov";
      case "avi":
        return "video/avi";
      case "webm":
        return "video/webm";
      default:
        return "image/jpeg"; // Default fallback
    }
  }
}

// Export singleton instance
export const mediaProcessor = new MediaProcessor();

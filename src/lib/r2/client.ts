import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export class R2Client {
  public s3Client: S3Client;
  private bucketName: string;
  private publicUrl?: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.publicUrl = config.publicUrl;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<UploadResult> {
    try {
      console.log(`[R2] Uploading file with key: ${key}`);
      console.log(`[R2] Bucket: ${this.bucketName}`);
      console.log(`[R2] Content-Type: ${contentType}`);
      console.log(`[R2] Buffer size: ${buffer.length} bytes`);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      });

      const result = await this.s3Client.send(command);
      console.log(`[R2] Upload successful, ETag: ${result.ETag}`);

      const url = this.publicUrl
        ? `${this.publicUrl}/${key}`
        : `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;

      return {
        key,
        url,
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      console.error("Error uploading file to R2:", error);
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error("Error deleting file from R2:", error);
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete multiple files from R2
   */
  async deleteFiles(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.deleteFile(key)));
    } catch (error) {
      console.error("Error deleting files from R2:", error);
      throw new Error(
        `Failed to delete files: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate a presigned URL for temporary access
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      console.log(`[R2] Generating presigned URL for key: ${key}`);
      console.log(`[R2] Bucket: ${this.bucketName}`);
      console.log(`[R2] Expires in: ${expiresIn} seconds`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });
      console.log(`[R2] Generated signed URL: ${signedUrl}`);

      return signedUrl;
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate a unique key for a file
   */
  generateFileKey(
    originalName: string,
    userId: string,
    prefix: string = "media",
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `${prefix}/${userId}/${timestamp}-${random}-${sanitizedName}`;
  }

  /**
   * Validate file type and size
   */
  validateFile(
    file: File,
    maxSize: number,
    allowedTypes: string[],
  ): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get file info from key
   */
  getFileInfo(key: string): {
    userId: string;
    filename: string;
    prefix: string;
  } {
    const parts = key.split("/");
    const prefix = parts[0];
    const userId = parts[1];
    const filename = parts.slice(2).join("/");

    return { userId, filename, prefix };
  }
}

// Create a singleton instance
let r2Client: R2Client | null = null;

export function getR2Client(): R2Client {
  if (!r2Client) {
    const config: R2Config = {
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME!,
      publicUrl: process.env.R2_PUBLIC_URL,
    };

    // Validate required environment variables
    if (
      !config.accountId ||
      !config.accessKeyId ||
      !config.secretAccessKey ||
      !config.bucketName
    ) {
      throw new Error("Missing required R2 environment variables");
    }

    r2Client = new R2Client(config);
  }

  return r2Client;
}

// File type constraints
export const MEDIA_CONSTRAINTS = {
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
  },
  VIDEO: {
    maxSize: 512 * 1024 * 1024, // 512MB
    allowedTypes: ["video/mp4", "video/mov", "video/avi", "video/webm"],
  },
} as const;

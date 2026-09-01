import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

let serviceClient = null;
let containerClientPromise = null;

function getServiceClient() {
  if (!CONNECTION_STRING) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }
  if (!serviceClient) {
    serviceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
  }
  return serviceClient;
}

function getContainerClient() {
  if (!CONTAINER_NAME) {
    throw new Error("AZURE_STORAGE_CONTAINER_NAME is not set");
  }
  if (!containerClientPromise) {
    const container = getServiceClient().getContainerClient(CONTAINER_NAME);
    // No `access` option => private container (no anonymous read)
    containerClientPromise = container.createIfNotExists().then(() => container);
  }
  return containerClientPromise;
}

/**
 * Uploads a file to Azure Blob Storage under a caller-chosen folder.
 * Reusable across features by passing a different `folder`.
 */
export async function uploadFileToBlob({ buffer, folder, fileName, contentType }) {
  if (!buffer || buffer.length === 0) {
    throw new Error("File is empty");
  }
  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File exceeds the 5MB limit");
  }
  if (!ALLOWED_UPLOAD_TYPES.includes(contentType)) {
    throw new Error("Only image or PDF files are allowed");
  }

  const safeFolder = String(folder || "uploads")
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "")
    .replace(/^\/+|\/+$/g, "") || "uploads";

  const safeName = String(fileName || "file")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .slice(-150); // keep it bounded

  const blobPath = `${safeFolder}/${Date.now()}-${safeName}`;

  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobPath);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return { blobPath };
}

/**
 * Generates a short-lived, read-only signed URL for a private blob.
 */
export async function getSignedBlobUrl(blobPath, expiresInMinutes = 15) {
  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobPath);

  const credential = getServiceClient().credential;

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER_NAME,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(Date.now() - 60 * 1000), // small clock-skew buffer
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    },
    credential
  ).toString();

  return `${blockBlobClient.url}?${sasToken}`;
}

/** Companion cleanup helper — not wired into any flow yet. */
export async function deleteFileFromBlob(blobPath) {
  const container = await getContainerClient();
  await container.getBlockBlobClient(blobPath).deleteIfExists();
}

import supabase from './supabase';

// Function to ensure bucket exists and has proper policies
export const ensureBucketExists = async () => {
  try {
    
    // Try to create the bucket (this will fail if it already exists, which is fine)
    const { data: createData, error: createError } = await supabase.storage.createBucket('deliverymedia', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 52428800 // 50MB
    });
    
    // Test bucket access
    const { data: files, error: listError } = await supabase.storage
      .from('deliverymedia')
      .list('photos', { limit: 1 });
    
    if (listError) {
      console.error('Error listing files in bucket:', listError);
      return { error: listError };
    } else {
      return { success: true, files };
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return { error };
  }
};

// Function to test bucket access and list available buckets
export const testBucketAccess = async () => {
  try {
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    // Test deliverymedia bucket specifically
    const { data: files, error: filesError } = await supabase.storage
      .from('deliverymedia')
      .list('photos', { limit: 1 });
    
    return { buckets, files, bucketsError, filesError };
  } catch (error) {
    console.error('Error testing bucket access:', error);
    return { error };
  }
};

// Function to check if a storage URL is accessible
export const checkStorageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Error checking storage URL:', error);
    return false;
  }
};

// Function to get a fallback URL or handle inaccessible URLs
export const getAccessibleStorageUrl = async (url: string): Promise<string> => {
  // Check if it's already a signed URL
  if (url.includes('/sign/') && url.includes('?token=')) {
    const isAccessible = await checkStorageUrl(url);
    if (isAccessible) {
      return url;
    }
  }
  
  // If it's a public URL or not accessible, try to get a signed URL
  try {
    let path: string;
    
    if (url.includes('/public/')) {
      path = url.split('/public/')[1];
    } else if (url.includes('/sign/')) {
      // Extract path from signed URL
      const urlParts = url.split('/sign/')[1];
      path = urlParts.split('?')[0];
    } else {
      // Try to extract path from any URL format
      const urlParts = url.split('/deliverymedia/');
      if (urlParts.length > 1) {
        path = urlParts[1];
      } else {
        return url; // Return original if we can't parse it
      }
    }
    
    if (path) {
      const { data } = await supabase.storage
        .from('deliverymedia')
        .createSignedUrl(path, 31536000); // 1 year expiry
      
      if (data?.signedUrl) {
        return data.signedUrl;
      }
    }
  } catch (error) {
    console.error('Error creating signed URL:', error);
  }
  
  // Return original URL as fallback
  return url;
};

export const uploadToStorage = async (
  file: File | string,
  bucket: string,
  path: string,
  fileType: 'photo' | 'signature' = 'photo'
): Promise<string> => {
  try {
    let fileData: File;
    let fileName: string;

    if (typeof file === 'string') {
      // Convert base64 data URL to File
      const response = await fetch(file);
      const blob = await response.blob();
      const prefix = fileType === 'signature' ? 'sign' : 'pic';
      fileData = new File([blob], `${prefix}-${Date.now()}.png`, { type: 'image/png' });
      fileName = `${prefix}-${Date.now()}.png`;
    } else {
      fileData = file;
      const prefix = fileType === 'signature' ? 'sign' : 'pic';
      fileName = `${prefix}-${Date.now()}-${file.name}`;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${path}/${fileName}`, fileData, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get signed URL instead of public URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(`${path}/${fileName}`, 31536000); // 1 year expiry

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      throw signedUrlError;
    }

    if (!signedUrlData.signedUrl) {
      throw new Error('Failed to get signed URL for uploaded file');
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error uploading to storage:', error);
    throw error;
  }
};

export const uploadImage = async (
  file: File | string,
  folder: string = 'photos'
): Promise<string> => {
  return uploadToStorage(file, 'deliverymedia', folder, 'photo');
};

export const uploadSignature = async (
  signatureDataUrl: string,
  folder: string = 'signatures'
): Promise<string> => {
  return uploadToStorage(signatureDataUrl, 'deliverymedia', folder, 'signature');
}; 
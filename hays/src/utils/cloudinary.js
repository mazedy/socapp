import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'socapp';
const UPLOAD_PRESET = 'socapp_uploads'; // You'll need to create this in your Cloudinary settings
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Additional upload options
 * @param {string} [options.folder] - Optional folder in Cloudinary
 * @returns {Promise<string>} The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (file, { folder } = {}) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await axios.post(UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Uploads a file using the backend API
 * @param {File} file - The file to upload
 * @param {Object} options - Additional upload options
 * @param {string} [options.folder] - Optional folder in Cloudinary
 * @returns {Promise<string>} The secure URL of the uploaded file
 */
export const uploadViaBackend = async (file, { folder } = {}) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post('/api/upload/image', formData, {
      params: { folder },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  } catch (error) {
    console.error('Error uploading file via backend:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

// Default export for backward compatibility
export default {
  uploadToCloudinary,
  uploadViaBackend,
};

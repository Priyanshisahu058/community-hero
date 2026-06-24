/**
 * Compress an image file using Canvas API to keep it under maxSizeKB
 * @param {File} file - The image file to compress
 * @param {number} maxSizeKB - Maximum size in KB (default 500)
 * @param {number} quality - Initial JPEG quality (0-1, default 0.8)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, maxSizeKB = 500, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if image is too large
        const MAX_DIM = 1920
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Iteratively reduce quality until under limit
        const compress = (q) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) { reject(new Error('Canvas toBlob failed')); return }
              if (blob.size / 1024 <= maxSizeKB || q <= 0.1) {
                resolve(blob)
              } else {
                compress(q - 0.1)
              }
            },
            'image/jpeg',
            q,
          )
        }
        compress(quality)
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

/**
 * Convert a File/Blob to base64 string (without data URI prefix)
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result
      // Strip "data:image/jpeg;base64," prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
  })
}

/**
 * Format bytes to human readable string
 * @param {number} bytes
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

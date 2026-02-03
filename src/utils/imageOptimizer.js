/**
 * 이미지 최적화 유틸리티
 * - 클라이언트 사이드에서 리사이징
 * - 자동 압축으로 용량 절감
 * - 성능 고려한 적당한 품질
 */

// 최대 크기 설정 (적당한 크기로 제한)
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const THUMBNAIL_SIZE = 200;
const QUALITY = 0.8; // 80% 품질

/**
 * 이미지 파일을 최적화된 Base64로 변환
 * @param {File} file - 이미지 파일
 * @param {Object} options - 옵션 { maxWidth, maxHeight, quality }
 * @returns {Promise<string>} Base64 문자열
 */
export async function optimizeImage(file, options = {}) {
  const {
    maxWidth = MAX_WIDTH,
    maxHeight = MAX_HEIGHT,
    quality = QUALITY,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // 리사이징 계산
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Canvas에 그리기
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Base64로 변환 (JPEG로 압축)
        const optimizedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(optimizedDataUrl);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 썸네일 생성
 * @param {File} file - 이미지 파일
 * @returns {Promise<string>} 썸네일 Base64
 */
export async function createThumbnail(file) {
  return optimizeImage(file, {
    maxWidth: THUMBNAIL_SIZE,
    maxHeight: THUMBNAIL_SIZE,
    quality: 0.7,
  });
}

/**
 * 이미지 파일 검증
 * @param {File} file - 파일
 * @returns {boolean} 유효한 이미지 여부
 */
export function isValidImageFile(file) {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "JPG, PNG, WEBP 형식만 지원합니다." };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "파일 크기는 10MB 이하여야 합니다." };
  }

  return { valid: true };
}

/**
 * 여러 이미지 최적화
 * @param {FileList|File[]} files - 이미지 파일들
 * @returns {Promise<string[]>} Base64 배열
 */
export async function optimizeImages(files) {
  const fileArray = Array.from(files);
  const promises = fileArray.map((file) => {
    const validation = isValidImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    return optimizeImage(file);
  });

  return Promise.all(promises);
}

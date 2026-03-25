const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png']
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_DOC_EXTS = ['.pdf', '.hwp', '.hwpx', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
const MAX_DOC_SIZE = 200 * 1024 * 1024 // 200MB

function getExt(filename) {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase()
}

export function validateImageFile(file) {
  const ext = getExt(file.name)
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    return `허용되지 않는 파일 형식입니다. (허용: JPG, PNG)`
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    return `이미지 파일만 업로드할 수 있습니다.`
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `파일 크기가 너무 큽니다. (최대 10MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`
  }
  return null
}

export function validateDocFile(file) {
  const ext = getExt(file.name)
  if (!ALLOWED_DOC_EXTS.includes(ext)) {
    return `허용되지 않는 파일 형식입니다. (허용: PDF, HWP, DOC, DOCX, XLS, XLSX, PPT, PPTX)`
  }
  if (file.size > MAX_DOC_SIZE) {
    return `파일 크기가 너무 큽니다. (최대 200MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`
  }
  return null
}

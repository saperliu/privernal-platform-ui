import { request } from '../../request';

// eslint-disable-next-line max-params
export function uploadSystemFile(
  fileList: AppUpload.FileItem[],
  module: string,
  sourceId: string,
  sourceStage: string,
  type: string,
  filePath?: string
) {
  const files: File[] = [];
  fileList.forEach(item => {
    if (item.file !== null && item.file !== undefined) {
      files.push(item.file);
    }
  });
  const result: SystemFileInfoNamespace.SystemFileUploadDTO = {
    file: files,
    module,
    sourceId,
    sourceStage,
    filePath,
    type
  };
  return uploadFile(result);
}

// 上传文件
function uploadFile(data: SystemFileInfoNamespace.SystemFileUploadDTO) {
  return request.post<SystemFileInfoNamespace.SystemFileDTO>('/file/back/file/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 下载文件
export function downloadFile(data: string) {
  return request.get(`/file/back/file/downLoad`, {
    params: { fileName: data }
  });
}

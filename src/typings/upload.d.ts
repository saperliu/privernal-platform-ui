/**
 * 上传文件项类型（替代 naive-ui 的 AppUpload.FileItem，业务上传链路通用结构）
 */
declare namespace AppUpload {
  interface FileItem {
    id?: string;
    name: string;
    status?: 'pending' | 'uploading' | 'success' | 'error' | 'removed';
    percentage?: number;
    file?: File | null;
    url?: string;
    thumbnailUrl?: string;
    type?: string;
    response?: any;
  }
}

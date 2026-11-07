import { request } from '../../request';

export async function findSystemFileInfoArray(module: string, sourceId: string, sourceStage: string) {
  const query: SystemFileInfoNamespace.SystemFileInfoQuery = {
    module,
    sourceStage,
    sourceId,
    pageNum: 1,
    pageSize: 10
  };
  const list: AppUpload.FileItem[] = [];
  const result = await findSystemFileInfoList(query);
  if (result.error === null) {
    await result.data.forEach(item => {
      const n: AppUpload.FileItem = {
        id: item.id,
        name: item.originalName,
        status: 'success',
        url: item.imageUrl
      };
      list.push(n);
    });

    return list;
  }
  return [];
}

// 查询文件信息列表
function findSystemFileInfoList(data: SystemFileInfoNamespace.SystemFileInfoQuery) {
  return request.post<SystemFileInfoNamespace.SystemFileInfoForm[]>('/file/back/system/fileInfo/list', data);
}

// 查询文件信息列表
export function findSystemFileInfoListPage(data: SystemFileInfoNamespace.SystemFileInfoQuery) {
  return request.post<SystemFileInfoNamespace.SystemFileInfoPage>('/file/back/system/fileInfo/list/page', data);
}

// 查询文件信息详细
export function findSystemFileInfoDetail(id: string) {
  return request.get<SystemFileInfoNamespace.SystemFileInfoForm>(`/file/back/system/fileInfo/${id}`);
}

// 新增文件信息
export function saveSystemFileInfoDetail(data: SystemFileInfoNamespace.SystemFileInfoForm) {
  return request.post(`/file/back/system/fileInfo/save`, data);
}

// 修改文件信息
export function updateSystemFileInfoDetail(data: SystemFileInfoNamespace.SystemFileInfoForm) {
  return request.put(`/file/back/system/fileInfo/edit`, data);
}

// 删除文件信息
export function delSystemFileInfo(data: string[]) {
  return request.delete(`/file/back/system/fileInfo/${data}`, {});
}

import type { AxiosResponse } from 'axios';
import * as XLSX from 'xlsx';

/**
 * 下载文件，根据返回的内容类型进行下载
 * @param response
 */
export function downloadFile(response: AxiosResponse) {
  if (response.status === 200) {
    console.log('------res.error--', response);
    let fileName = `${new Date().getTime()}.xlsx`;
    if (
      response.headers['content-disposition'] !== undefined &&
      response.headers['content-disposition'].includes('=')
    ) {
      const file = response.headers['content-disposition'].split('=')[1];
      fileName = decodeURIComponent(file);
    }

    const blob = new Blob([response.data], { type: `text/plain;charset=utf-8` });
    // 获取heads中的filename文件名
    const downloadElement = document.createElement('a');
    // 创建下载的链接
    const href = window.URL.createObjectURL(blob);
    downloadElement.href = href;
    // 下载后文件名
    downloadElement.download = fileName;
    document.body.appendChild(downloadElement);
    // 点击下载
    downloadElement.click(); // 下载完成移除元素
    document.body.removeChild(downloadElement);
    // 释放掉blob对象
  }
  return response.status;
}

/**
 * 触发浏览器下载（原实现用的是 file-saver 的 saveAs，该依赖未安装，这里按 downloadFile 同款 DOM 方式实现）
 */
function saveBlobAs(blob: Blob, fileName: string) {
  const href = window.URL.createObjectURL(blob);
  const downloadElement = document.createElement('a');
  downloadElement.href = href;
  downloadElement.download = fileName;
  document.body.appendChild(downloadElement);
  downloadElement.click();
  document.body.removeChild(downloadElement);
}

/**
 * 下载table里的数据为excel
 * @param id
 * @param fileName
 */
export function downloadTable(id: string, fileName: string) {
  // 导出Excel
  const et = XLSX.utils.table_to_book(document.getElementById(id)); // 此处传入table的DOM节点
  const outFile = XLSX.write(et, {
    bookType: 'xlsx',
    bookSST: true,
    type: 'array'
  });
  try {
    saveBlobAs(
      new Blob([outFile], {
        type: 'application/octet-stream'
      }),
      fileName
    ); // trade-publish.xlsx 为导出的文件名
  } catch (e) {
    console.log(e, outFile);
  }
  return outFile;
}

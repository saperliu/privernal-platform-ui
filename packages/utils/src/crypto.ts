import CryptoJS from 'crypto-js';

export class Crypto<T extends object> {
  /** Secret */
  secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  encrypt(data: T): string {
    const dataString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(dataString, this.secret);
    return encrypted.toString();
  }

  decrypt(encrypted: string) {
    const decrypted = CryptoJS.AES.decrypt(encrypted, this.secret);
    const dataString = decrypted.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(dataString) as T;
    } catch {
      // avoid parse error
      return null;
    }
  }
}

/**
 * 加密数据sha512（登录密码加密，迁自 perfect-cloud-ui）
 *
 * @param data - 数据
 */
export function encrypt512(data: any) {
  return CryptoJS.SHA512(data).toString();
}

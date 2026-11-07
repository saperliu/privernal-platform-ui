/**
 * 钉钉扫码登录
 * @author saperliu
 * @version 2023-01-09
 */

class Dingtalk {
  private goto: string;

  constructor() {
    this.goto = '';
  }

  public processUrl(appid: string, state: string, domain: string): void {
    // 文档地址：https://open.dingtalk.com/document/orgapp-server/scan-qr-code-to-log-on-to-third-party-websites
    const urlPreffix = `https://oapi.dingtalk.com/connect/oauth2/sns_authorize?appid=${appid}&response_type=code&scope=snsapi_login&state=`;
    const backUrl = encodeURIComponent(`${domain}`); // 扫码后跳转的地址
    this.goto = `${urlPreffix}${state}&redirect_uri=${backUrl}`;
  }

  /**
   * 初始化钉钉二维码
   */
  public init() {
    const scriptEle = document.createElement('script');
    const win: any = window;

    const handleMessage = (event: any) => {
      const { origin, data } = event;
      if (origin === 'https://login.dingtalk.com') {
        const redirectUri = `${this.goto}&loginTmpCode=${data}`;
        if (win.parent === window) {
          parent.location.href = redirectUri;
        } else {
          win.parent.location.href = redirectUri;
        }
      }
    };

    // scriptEle.src = 'https://g.alicdn.com/dingding/h5-dingtalk-login/0.21.0/ddlogin.js';
    scriptEle.src = 'https://g.alicdn.com/dingding/dinglogin/0.0.5/ddLogin.js';
    document.head.appendChild(scriptEle);

    if (typeof win.addEventListener !== 'undefined') {
      win.addEventListener('message', handleMessage, false);
    } else if (typeof win.attachEvent !== 'undefined') {
      win.attachEvent('onmessage', handleMessage);
    }
  }

  /**
   * 显示钉钉二维码
   * @description 等待script标签创建完毕再调用这个方法
   * @param { String } codeId 显示二维码的id
   */
  public showCode(codeId: string) {
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      DDLogin({
        id: codeId,
        goto: encodeURIComponent(this.goto),
        style: 'background-color: transparent;border: none',
        with: '210',
        height: '310'
      });
    }, 500);
  }
}

export default new Dingtalk();

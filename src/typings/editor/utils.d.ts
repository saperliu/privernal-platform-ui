declare module '@/utils/Logger' {
  /** 纯静态日志工具（原声明为只含静态方法的类，等价改写为对象导出） */
  export const Logger: {
    print(type: string, text: any, back?: boolean): void;

    printBack(type: string, text: any): void;

    pretty(type: any, title: string, ...text: any[]): void;

    prettyPrimary(title: string, ...text: any[]): void;

    prettySuccess(title: string, ...text: any[]): void;

    prettyWarn(title: string, ...text: any[]): void;

    prettyError(title: string, ...text: any[]): void;

    prettyInfo(title: string, ...text: any[]): void;
  };
  export default Logger;
}

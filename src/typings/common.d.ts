/** The common type namespace */
declare namespace CommonType {
  /** The strategic pattern */
  interface StrategicPattern {
    /** The condition */
    condition: boolean;
    /** If the condition is true, then call the action function */
    callback: () => void;
  }

  /**
   * The option type
   *
   * @property value: The option value
   * @property label: The option label
   */
  type Option<K = string, M = string> = { value: K; label: M };

  type YesOrNo = 'Y' | 'N';

  /** add null to all properties（业务代码按 null 语义使用，迁自 perfect-cloud-ui） */
  type RecordNullable<T> = {
    [K in keyof T]?: T[K] | null;
  };

  /** 策略模式 [状态, 为true时执行的回调函数] */
  type StrategyAction = [boolean, () => void];

  /** 字典JSON字段的封装，selected 为单选值， selectList 为多选值,逗号分隔 */
  interface JSONObject<T> {
    selected?: string;
    selectList?: string;
    sourceList?: T[];
  }
}

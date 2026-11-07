import type { Ref } from 'vue';
import type { FormItemRule } from 'element-plus';
import { REG_CODE_SIX, REG_EMAIL, REG_PHONE, REG_PWD, REG_USER_NAME } from '@/constants';

/** 创建自定义错误信息的必填表单规则 */
export const createRequiredFormRule = (message = '不能为空'): FormItemRule => ({ required: true, message });
export const createRequiredMinMaxRule = (
  minNum = 2,
  maxNum = 10,
  minMessage = '最短长度为 %',
  maxMessage = '最长长度为 %'
  // eslint-disable-next-line max-params
): FormItemRule[] => [
  { required: true, min: minNum, message: minMessage.replace('%', `${minNum}`), trigger: 'blur' },
  { required: true, max: maxNum, message: maxMessage.replace('%', `${maxNum}`), trigger: 'blur' }
];

export const createMaxLengthRule = (
  maxNum = 255,
  maxMessage = '最长长度为 %'
  // eslint-disable-next-line max-params
): FormItemRule[] => [{ required: false, max: maxNum, message: maxMessage.replace('%', `${maxNum}`), trigger: 'blur' }];

export const requiredFormRule = createRequiredFormRule();

/** 表单规则 */
interface CustomFormRules {
  /** 手机号码 */
  phone: FormItemRule[];
  /** 密码 */
  pwd: FormItemRule[];
  /** 验证码 */
  code: FormItemRule[];
  /** 邮箱 */
  email: FormItemRule[];
  /** 长度限制 */
  minMaxRule: FormItemRule[];
  /**
   * 登录名
   */
  loginName: FormItemRule[];
}

/** 表单规则 */
export const formRules: CustomFormRules = {
  phone: [
    createRequiredFormRule('请输入手机号码'),
    { pattern: REG_PHONE, message: '手机号码格式错误', trigger: 'input' }
  ],
  pwd: [
    createRequiredFormRule('请输入密码'),
    { pattern: REG_PWD, message: '密码为6-18位数字/字符/符号，至少2种组合', trigger: 'input' }
  ],
  code: [
    createRequiredFormRule('请输入验证码'),
    { pattern: REG_CODE_SIX, message: '验证码格式错误', trigger: 'input' }
  ],
  email: [{ pattern: REG_EMAIL, message: '邮箱格式错误', trigger: 'blur' }],
  minMaxRule: [createRequiredFormRule('请输入手机号码'), ...createRequiredMinMaxRule()],
  loginName: [
    createRequiredFormRule('请输入用户名'),
    { pattern: REG_USER_NAME, message: '用户名为4-50位必须以字母开头，只能包含字母、数字、下划线', trigger: 'input' }
  ]
};

/** 是否为空字符串 */
function isBlankString(str: string) {
  return str.trim() === '';
}

/** 获取确认密码的表单规则 */
export function getConfirmPwdRule(pwd: Ref<string>) {
  const mismatchMessage = '输入的值与密码不一致';
  const confirmPwdRule: FormItemRule[] = [
    { required: true, message: '请输入确认密码' },
    {
      validator: (_rule, value, callback) => {
        if (!isBlankString(value) && value !== pwd.value) {
          callback(new Error(mismatchMessage));
          return;
        }
        callback();
      },
      message: mismatchMessage,
      trigger: 'input'
    }
  ];
  return confirmPwdRule;
}

/** 获取图片验证码的表单规则 */
export function getImgCodeRule(imgCode: Ref<string>) {
  const mismatchMessage = '验证码不正确';
  const imgCodeRule: FormItemRule[] = [
    { required: true, message: '请输入验证码' },
    {
      validator: (_rule, value, callback) => {
        if (!isBlankString(value) && value !== imgCode.value) {
          callback(new Error(mismatchMessage));
          return;
        }
        callback();
      },
      message: mismatchMessage,
      trigger: 'blur'
    }
  ];
  return imgCodeRule;
}

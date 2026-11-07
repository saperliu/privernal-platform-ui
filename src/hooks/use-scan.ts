import { onUnmounted, ref } from 'vue';

/**
 * useScan —— 扫码门面（D1-M1 浏览器轨，skill-plan-upgrade §4-D1）。
 *
 * 降级链（容器判定顺序：钉钉 → APP → 浏览器；钉钉/APP 轨为净新增待接入，见附录 C-8/C-10）：
 * ① BarcodeDetector（Chrome/Edge/Android、Safari 17+，需 https 或 localhost）
 * ② 手动输入（始终保留——http 内网部署相机不可用时的正式交付形态，非降级缺陷）
 *
 * 用法：
 *   const { supported, scanning, error, start, stop, result } = useScan();
 *   await start({ types: ['qr_code', 'code_128'], onScan });
 *   模板里始终渲染手动输入框作为兜底。
 */
export function useScan() {
  const supported = ref(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  const scanning = ref(false);
  const error = ref('');
  const result = ref('');

  let stream: MediaStream | null = null;
  let detector: any = null;
  let rafId = 0;
  let callback: ((text: string) => void) | null = null;

  async function start(options?: { types?: string[]; onScan?: (text: string) => void }) {
    error.value = '';
    result.value = '';
    callback = options?.onScan ?? null;
    if (!supported.value) {
      error.value = '当前浏览器不支持 BarcodeDetector，请使用手动输入';
      return false;
    }
    try {
      const Detector = (window as any).BarcodeDetector;
      detector = new Detector({
        formats: options?.types ?? ['qr_code', 'code_128', 'ean_13']
      });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      scanning.value = true;
      const tick = async () => {
        if (!scanning.value || !detector) return;
        try {
          const codes = await detector.detect(video);
          if (codes?.length) {
            const text = String(codes[0].rawValue ?? '');
            if (text) {
              result.value = text;
              callback?.(text);
              stop();
              return;
            }
          }
        } catch {
          // 单帧失败忽略，继续下一帧
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      return true;
    } catch (e: any) {
      // 相机权限失败/无摄像头/http 内网环境：明确文案 + 落手动输入（§4-D1 交付话术预置）
      error.value =
        e?.name === 'NotAllowedError'
          ? '相机权限被拒绝，请在浏览器设置中允许后重试，或直接手动输入'
          : '相机不可用（内网 http 部署或无摄像头），请直接手动输入';
      stop();
      return false;
    }
  }

  function stop() {
    scanning.value = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    detector = null;
  }

  /** 手动输入提交（门面统一出口，与扫码结果同构） */
  function submitManual(text: string) {
    const trimmed = text?.trim();
    if (!trimmed) return false;
    result.value = trimmed;
    callback?.(trimmed);
    return true;
  }

  onUnmounted(stop);

  return { supported, scanning, error, result, start, stop, submitManual };
}

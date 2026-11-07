import { useAppStore } from '@/store';

export default function useBodyLoading() {
  const app = useAppStore();
  const bodyLoading = app.bodyLoading;
  function startBodyLoading() {
    app.openBodyLoading();
  }

  function endBodyLoading() {
    app.closeBodyLoading();
  }
  // const { bool: bodyLoading, setTrue: startBodyLoading, setFalse: endBodyLoading } = useBoolean(initValue);

  return {
    bodyLoading,
    startBodyLoading,
    endBodyLoading
  };
}

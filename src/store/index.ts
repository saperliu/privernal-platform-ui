import type { App } from 'vue';
import { createPinia } from 'pinia';
import { resetSetupStore } from './plugins';
import { useAppStore } from './modules/app';
import { useAuthStore } from './modules/auth';
import { useFormCommandStore } from './modules/form-command';
import { useRouteStore } from './modules/route';
import { useDatavStore } from './modules/datav';

/** Setup Vue store plugin pinia */
export function setupStore(app: App) {
  const store = createPinia();

  store.use(resetSetupStore);

  app.use(store);
}

export { useAppStore, useAuthStore, useRouteStore, useFormCommandStore, useDatavStore };

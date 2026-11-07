export interface EditorSettings {
  language: string;
  processName: string;
  processId: string;
  processEngine: 'flowable' | 'activiti' | 'camunda' | 'warm-flow';
  paletteMode: 'default' | 'custom' | 'rewrite' | 'enhancement';
  penalMode: 'default' | 'custom' | 'rewrite';
  contextPadMode: 'default' | 'rewrite' | 'enhancement';
  rendererMode: 'default' | 'rewrite' | 'enhancement';
  bg: string;
  toolbar: boolean;
  miniMap: boolean;
  contextmenu: boolean;
  customContextmenu: boolean;
  otherModule: boolean;
  templateChooser: boolean;
  useLint: boolean;
  customTheme: Record<string, string | number>;
}

export type ModelerOptions = {
  additionalModules: any[];
  moddleExtensions: object;
};

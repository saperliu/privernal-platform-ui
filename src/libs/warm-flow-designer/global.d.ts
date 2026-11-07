declare module './warm-flow-designer.es.js' {
  export const FlowDesigner: any;
  export const WarmFlowDesigner: any;
  export function setUiAdapter(adapter: any): void;
  export function setDataProvider(provider: any): void;
  export function createMockProvider(): any;
  export function useFlowDesigner(): any;
  export function useFlowJson(ref: any): any;
}

declare module './naive.es.js' {
  export const naiveAdapter: any;
  export default naiveAdapter;
}

import { DataProvider } from './provider';
/**
 * 默认数据源实现：基于内置 axios 调用 warm-flow REST 接口。
 *
 * 行为与原 api/* 完全一致，作为 dataProvider 的默认回退实现，保证现有 iframe / webjars
 * 集成方式零影响。业务方可通过 setDataProvider 覆盖其中任意方法，未覆盖的自动回退到此实现。
 *
 * @author warm
 */
export declare function createHttpProvider(): DataProvider;

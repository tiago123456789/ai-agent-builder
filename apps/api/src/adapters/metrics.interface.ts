
export type MetricOptions = {
    name: string;
    help: string;
    type?: 'counter' | 'gauge' | 'histogram';
    resultKey?: string
    labels?: { [key: string]: any };
    buckets?: number[];
}

interface IMetricsAdapter<T> {

    getMetrics(options: MetricOptions): T;

    getResultMetrics(): Promise<string>;
}

export default IMetricsAdapter;
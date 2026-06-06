import IMetricsAdapter, { MetricOptions } from "./metrics.interface"

import {
    Registry,
    Counter,
    Histogram,
    Gauge,
    collectDefaultMetrics,
} from 'prom-client';

const cacheMetrics: { [key: string]: { [key: string]: Counter | Gauge | Histogram } } = {
    "counter": {},
    "gauge": {},
    "histogram": {}
}

class PrometheusMetricsAdapter implements IMetricsAdapter<Counter | Gauge | Histogram> {

    private registry: Registry;

    constructor() {
        this.registry = new Registry();
        collectDefaultMetrics({ register: this.registry });
    }

    getMetrics(options: MetricOptions): Counter | Gauge | Histogram {
        const type = options.type ?? "histogram"
        if (cacheMetrics[type][options.name]) {
            return cacheMetrics[type][options.name]
        } else {
            const labelsParams = Object.keys(options.labels || {})
            if (type === 'counter') {
                const counter = new Counter({
                    name: `${options.name}_total`,
                    help: options.help,
                    registers: [this.registry],
                    labelNames: labelsParams
                });

                cacheMetrics[type][options.name] = counter
            }

            if (type === 'gauge') {
                const gauge = new Gauge({
                    name: options.name,
                    help: options.help,
                    registers: [this.registry],
                    labelNames: labelsParams
                });

                cacheMetrics[type][options.name] = gauge
            }

            if (type === 'histogram') {
                const histogram = new Histogram({
                    name: options.name,
                    help: options.help,
                    registers: [this.registry],
                    buckets: options.buckets || [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
                    labelNames: labelsParams
                });

                cacheMetrics[type][options.name] = histogram

            }

            return cacheMetrics[type][options.name]
        }
    }

    getResultMetrics(): Promise<string> {
        return this.registry.metrics()
    }
}

const prometheusMetricsAdapter = new PrometheusMetricsAdapter()


export default prometheusMetricsAdapter;
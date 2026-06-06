import { MetricOptions } from "../adapters/metrics.interface"
import prometheusMetricsAdapter from "../adapters/prometheus-metrics.adapter"
import { Counter, Gauge, Histogram } from 'prom-client'

function Metric(options: MetricOptions) {

    return function (
        originalMethod: any, context: ClassMethodDecoratorContext
    ) {

        if (options.type === 'counter') {
            const counter = prometheusMetricsAdapter.getMetrics(options) as Counter

            return function (this: any, ...args: any[]) {
                const result = originalMethod.call(this, ...args);
                counter.inc(options.labels || {})
                return result;
            };

        }

        if (options.type === 'gauge') {
            const gauge = prometheusMetricsAdapter.getMetrics(options) as Gauge

            return function (this: any, ...args: any[]) {
                const result = originalMethod.call(this, ...args);
                const keyValue = result[options.resultKey as string]
                if (keyValue) {
                    gauge.inc(options.labels || {}, result[options.resultKey as string])
                } else {
                    gauge.inc(options.labels || {})
                }
                return result;
            };
        }
    };

}


function MetricHistogram(options: MetricOptions) {
    return function (originalMethod: any, context: ClassMethodDecoratorContext) {
        return async function (this: any, ...args: any[]) {
            const histogram = prometheusMetricsAdapter.getMetrics({ ...options, type: "histogram" }) as Histogram

            const end = histogram.startTimer(options.labels || {});

            try {
                const result = await originalMethod.call(this, ...args);
                return result;
            } finally {
                end();
            }
        };
    };
}

async function track(options: MetricOptions, callback: Function): Promise<any> {
    if (options.type === 'counter') {
        const counter = prometheusMetricsAdapter.getMetrics(options) as Counter
        const results = await callback()
        counter.inc(options.labels || {})
        return results;
    };

    if (options.type === 'gauge') {
        const gauge = prometheusMetricsAdapter.getMetrics(options) as Gauge
        const results = await callback()
        const keyValue = results[options.resultKey as string]
        if (keyValue) {
            gauge.inc(options.labels || {}, results[options.resultKey as string])
        } else {
            gauge.inc(options.labels || {})
        }
        return results;
    }

    const histogram = prometheusMetricsAdapter.getMetrics({ ...options, type: "histogram" }) as Histogram
    const end = histogram.startTimer(options.labels || {});

    try {
        const result = await callback()
        return result;
    } finally {
        end();
    }
};

export { Metric, MetricHistogram, track }

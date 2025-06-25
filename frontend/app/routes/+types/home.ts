import type { MetaFunction } from "@remix-run/node";

export namespace Route {
    export type MetaArgs = {
        data: unknown;
        parentsData: unknown;
        params: unknown;
        location: unknown;
    };

    export type Meta = ReturnType<MetaFunction>;
}

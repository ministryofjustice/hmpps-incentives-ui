// NOTE: There is a PR to update @types/jquery for version 4.x, this file
// is adapted from that PR. This shouldn't be needed anymore once upstream
// types are released.
//
// See: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/74367

import { type DOMWindow } from 'jsdom'

// jQuery factory for environments without a window (CommonJS)
// Usage: const { jQueryFactory } = require("jquery/factory");
//        const $ = jQueryFactory(window);

export default {}

export declare function jQueryFactory(window: DOMWindow): JQueryStatic

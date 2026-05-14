import { PAGES_METAS } from "./constants";
/**
 * Basic props for a page
 * Meta
 */
export class Page {
    _meta;
    _pageName;
    constructor(pageName) {
        this._pageName = pageName;
    }
    get meta() {
        if (this._meta !== undefined)
            return this._meta;
        this._meta = PAGES_METAS[this._pageName];
        return this._meta || null;
    }
}

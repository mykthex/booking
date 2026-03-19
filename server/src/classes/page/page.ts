import { PAGES_METAS } from "./constants";
import { PageMeta, PageName } from "./types";

/**
 * Basic props for a page
 * Meta
 */
export class Page {
  protected _meta?: PageMeta | null;
  protected _pageName: PageName;

  constructor(pageName: PageName) {
    this._pageName = pageName;
  }

  get meta(): PageMeta {
    if (this._meta !== undefined) return this._meta;

    this._meta = PAGES_METAS[this._pageName];

    return this._meta || null;
  }
}

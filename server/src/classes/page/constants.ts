import { PageMeta, PageName } from "./types.js";

export const PAGES_METAS: { [key in PageName]: PageMeta } = {
  [PageName.Home]: {
    title: "Home",
    description: "Welcome to our homepage!",
    image: "https://example.com/home-image.jpg",
  },
};

import { when, setState, map, query } from "@lynx-json/jsua-style";
import mappers from '../mappers';

export default function image() {
  return [
    map(mappers.realChildren("img[data-lynx-embedded-view]"), [
      el => el.width = +el.getAttribute("data-lynx-width"),
      el => el.height = +el.getAttribute("data-lynx-height")
    ]),
    when("normal", el => el.style.display = "block"),
    when("visibility", "hidden", el => el.style.display = "none"),
    setState("normal")
  ];
}

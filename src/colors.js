export var primary = 'Indigo';
export var secondary = 'Yellow';

export function updateFromBanner() {
  return function (banner) {
    primary = banner.getAttribute('data-lynx-var-primaryColor');
    secondary = banner.getAttribute('data-lynx-var-secondaryColor');
  };
}

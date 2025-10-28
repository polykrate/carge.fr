/**
 * Scroll to an element with offset for fixed header
 * @param {React.RefObject} ref - React ref of the element to scroll to
 * @param {number} offset - Additional offset in pixels (default: 80 for header height)
 */
export const scrollToElement = (ref, offset = 80) => {
  if (!ref.current) return;

  const element = ref.current;
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};


/**
 * Scroll to an element with offset for fixed header
 * @param {React.RefObject} ref - React ref of the element to scroll to
 * @param {number} offset - Additional offset in pixels (default: 80 for header height)
 */
export const scrollToElement = (ref, offset = 80) => {
  console.log('🔄 scrollToElement called, ref:', ref, 'ref.current:', ref.current);
  if (!ref.current) {
    console.log('❌ ref.current is null, aborting scroll');
    return;
  }

  const element = ref.current;
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  console.log('✅ Scrolling to position:', offsetPosition);
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};


import { v4 as uuid } from 'uuid';

type Rect = {
  top: number, left: number,
  right: number, bottom: number,
  width: number, height: number,
}
type PageRect = Rect & {
  page: number
};

const createUniqueId = () => uuid();

const htmlToElements = (html: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.firstChild as HTMLElement;
}

const closestPageEl = (el: Element) => el.closest(`.pdfViewer .page`) as HTMLElement;
const getPageNum = (pageEl: HTMLElement) => parseInt(pageEl.getAttribute('data-page-number') || '');
const getRectPageNum = (documentEl: Document, rect: Rect): number => {
  const pointEl = documentEl.elementFromPoint(rect.left, rect.top);
  return pointEl ? getPageNum(closestPageEl(pointEl)) : (null as any);
}
const getPageEl = (documentEl: any, pageNum: number) =>
  documentEl.querySelector(`.pdfViewer .page[data-page-number="${pageNum}"]`);

const relativeToPageEl = (rect: PageRect, pageEl: any): PageRect => {
  let { top, left, right, bottom, width, height, page } = rect;

  let prect = pageEl.getBoundingClientRect();
  const b = parseFloat(getComputedStyle(pageEl).borderWidth);
  const pTop = prect.top + b;
  const pLeft = prect.left + b;
  const pBottom = prect.bottom - b;
  const pRight = prect.right - b;
  const pHeight = prect.height - b * 2;
  const pWidth = prect.width - b * 2;

  top = parseFloat(((top - pTop) / pHeight * 100).toFixed(3));
  left = parseFloat(((left - pLeft) / pWidth * 100).toFixed(3));
  bottom = parseFloat(((pBottom - bottom) / pHeight * 100).toFixed(3));
  right = parseFloat(((pRight - right) / pWidth * 100).toFixed(3));
  width = parseFloat((width / pWidth * 100).toFixed(3));
  height = parseFloat((height / pHeight * 100).toFixed(3));

  return { top, left, right, bottom, width, height, page };
}

const mergeRects = (rects: Rect[]): Rect[] => {
  type IgnorableRect = Rect & { ignore?: boolean };
  let $rects = rects.map(({ top, right, bottom, left, width, height }) =>
    ({ top, right, bottom, left, width, height })) as IgnorableRect[];
  $rects = $rects.sort((a, b) => (a.width * a.height) - (b.width * b.height));
  // TODO: using 'ignore' may not be efficient

  // merge horizontal rects
  for (var i = 1; i < $rects.length; i++)
    for (var j = 0; j < i; j++) {
      const a = $rects[i];
      const b = $rects[j];

      if (!b.ignore
        && a.top == b.top
        && a.bottom == b.bottom
        && b.right >= a.left
      ) {
        a.ignore = b.ignore = true;
        const left = Math.min(a.left, b.left);
        const right = Math.max(a.right, b.right);

        $rects.push({
          top: b.top,
          bottom: b.bottom,
          left,
          right,
          height: a.bottom - a.top,
          width: right - left,
        });
      }
    }

  $rects = $rects.filter(rect => !rect.ignore);
  // merge completely-overlapping rects
  for (let i = 1; i < $rects.length; i++)
    for (let j = 0; j < i; j++) {
      const a = $rects[i];
      const b = $rects[j];

      if (!b.ignore
        && b.left >= a.left
        && b.top >= a.top
        && b.right <= a.right
        && b.bottom <= a.bottom
      ) {
        b.ignore = true;
        break;
      }
    }

  return $rects.filter(rect => !rect.ignore).map(rect => {
    const { ignore, ...attrs } = rect;
    return attrs;
  });
}

const groupByPageNum = (documentEl: any, rects: PageRect[]) => {
  const grouped: { [pageNum: number]: Rect[] } = {};

  rects.map(rect => relativeToPageEl(rect, getPageEl(documentEl, rect.page)))
    .filter(rect => (rect.left + rect.right) < 99.99 && (rect.top + rect.bottom) < 99.99)
    .forEach((rect) => {
      if (!grouped[rect.page])
        grouped[rect.page] = [];
      const { page, ...attrs } = rect;
      grouped[rect.page].push(attrs);
    });

  return grouped;
}

const rotateRect = (degree: 0 | 90 | 180 | 270, clockwise: boolean, rect: Rect) => {
  let values = [rect.top, rect.left, rect.bottom, rect.right];
  const steps = (degree % 360) / 90;

  values = clockwise
    ? values.slice(steps).concat(values.slice(0, steps))
    : values.slice(4 - steps).concat(values.slice(0, 4 - steps));

  return {
    top: values[0],
    left: values[1],
    bottom: values[2],
    right: values[3],
    width: degree == 90 || degree == 180 ? rect.height : rect.width,
    height: degree == 90 || degree == 180 ? rect.width : rect.height,
  }
}

const getBound = (rects: Rect[]): Rect => {
  return {
    left: Math.min(...rects.map(rect => rect.left)),
    right: Math.min(...rects.map(rect => rect.right)),
    top: Math.min(...rects.map(rect => rect.top)),
    bottom: Math.min(...rects.map(rect => rect.bottom)),
    width: 0,
    height: 0,
  };
}

const rotation = (pdfjs: any) => pdfjs.pdfViewer.pagesRotation;

export {
  Rect,
  createUniqueId,
  htmlToElements,
  getPageNum,
  getRectPageNum,
  closestPageEl,
  getPageEl,
  relativeToPageEl,
  mergeRects,
  groupByPageNum,
  rotateRect,
  getBound,
  rotation,
};
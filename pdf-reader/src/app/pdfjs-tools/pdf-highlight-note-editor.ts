import {
  WHRect, getPageEl, getPageNum, htmlToElements,
  getAnnotEl, isLeftClick, getAnnotElBound, getOrParent,
  removeSelectorAll,
  scale
} from './pdf-utils';
import { PdfRegistry } from './pdf-registry';

export class PdfHighlightNoteEditor {

  private registry: PdfRegistry;

  constructor({ registry }) {
    this.registry = registry;

    this.registry.register('highlight-note-editor', this);
    this.registry.register(`configs.default.highlight-note`, () => this._defaultConfigs());

    // remove popup on delete
    for (const type of ['underline', 'highlight', 'strikethrough'])
      this.registry.register(`${type}.deleted.${Math.random()}`,
        (annot) => removeSelectorAll(this._getDocumentEl(),
          `.pdfjs-annotation__highlight-note-editor-popup[data-highlight-id="${annot.id}"]`));

    this._onHighlightClick();
  }

  protected _configs() { return this.registry.get(`configs.highlight-note`); }
  protected _defaultConfigs() {
    return true;
  }

  private _getDocument() { return this.registry.getDocument(); }
  private _getDocumentEl() { return this.registry.getDocumentEl(); }
  private _getPdfJS() { return this.registry.getPdfJS(); }

  private _onHighlightClick() {
    this._getDocument().addEventListener('click', async ($event: any) => {
      if (!this._configs())
        return;

      const viewerPopup = getOrParent($event, '.pdfjs-annotation__highlight-note-viewer-popup');
      if (isLeftClick($event) && (this.registry.get('highlight-note-viewer').isValidAnnotEl($event) || viewerPopup)) {
        const annotEl = getAnnotEl($event.target),
          /**/ pageEl = getPageEl($event.target);
        this.removePopups();

        const annotId = viewerPopup
          ? viewerPopup.getAttribute('data-highlight-id')
          : annotEl.getAttribute('data-annotation-id');
        const annot = this.registry.get('storage').read(annotId);
        const bound = getAnnotElBound(pageEl.querySelector(`[data-annotation-id="${annotId}"]`));
        this._showEditorPopup(annot, getPageNum(pageEl), bound);
      } else if (!$event.target.closest('.pdfjs-annotation__highlight-note-editor-popup')) {
        this.removePopups();
      }
    });
  }

  removePopups() {
    this.registry.get('highlight-note-viewer').removePopups();
    this._getDocumentEl().querySelectorAll('.pdfjs-annotation__highlight-note-editor-popup').forEach(el => el.remove());
  }

  private _showEditorPopup(annot: any, pageNum: number, bound: WHRect) {
    const popupEl = htmlToElements(
      `<div class="pdfjs-annotation__highlight-note-editor-popup" data-highlight-id="${annot.id}">
        <textarea 
          rows="5" cols="35" 
          placeholder="Note ..."
          style="font-size: ${scale(this._getPdfJS()) * 100}%;"  
        >${annot.note || ''}</textarea>
        <style>
          .pdfjs-annotation__highlight-note-editor-popup {
            position: absolute;
            top: calc(100% - ${bound.bottom}%);
            left: ${bound.left}%;
            width: ${bound.width ? bound.width + '%' : 'fit-content'};
            height: ${bound.height ? bound.height + '%' : 'fit-content'};
            max-width: 50%;
            max-height: 50%;
            display: flex;
            flex-direction: column;
            pointer-events: auto;
            z-index: 6;
          }

          .pdfjs-annotation__highlight-note-editor-popup textarea {
            box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
            background-color: white;
            border-radius: 0.125rem;
            border-color: lightgray;
            outline: none;
            font-family: inherit;
            padding: 0.125rem;
          }
        </style>
      </div>`);

    this.registry.get('annotation-layer')
      .getOrAttachLayerEl(pageNum)
      .appendChild(popupEl);

    const textarea = popupEl.querySelector('textarea');
    textarea?.addEventListener('blur', async () => {
      if (this._getDocumentEl().querySelector(`[data-annotation-id="${annot.id}"]`)) {
        annot.note = textarea.value;
        this.registry.get('storage').update(annot);
      }
    });
  }
}

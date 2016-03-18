import {
  EventEmitter
} from 'events';

export default class MediaCropper extends EventEmitter {
  constructor(media) {

    super();

    //if you provide media into the constuctor, you will be provided with a drag and drop seclection rectangle in your media
    if (media) {
      let x1 = 0;
      let y1 = 0;
      let x2 = 0;
      let y2 = 0;
      let dragThreshold = 50;

      let mousedown = false;
      let dragging = false;

      const selectionRect = document.createElement('div');

      //style
      selectionRect.id = 'selectionRect';
      selectionRect.style.border = '1px dotted #000';
      selectionRect.style.position = 'fixed';
      selectionRect.style.backgroundColor = 'red';
      selectionRect.style.opacity = 0.5;
      selectionRect.hidden = 1;
      document.body.appendChild(selectionRect);

      //recalculates the selectionRectangle, when dragging
      const reCalc = () => {
        let x3 = Math.min(x1, x2);
        let x4 = Math.max(x1, x2);
        let y3 = Math.min(y1, y2);
        let y4 = Math.max(y1, y2);
        selectionRect.style.left = x3 + 'px';
        selectionRect.style.top = y3 + 'px';
        selectionRect.style.width = x4 - x3 + 'px';
        selectionRect.style.height = y4 - y3 + 'px';
      };

      media.onmousedown = (e) => {
        mousedown = true;
        selectionRect.hidden = 0;
        x1 = e.clientX;
        y1 = e.clientY;
      };
      onmousemove = (e) => {
        if (mousedown) {
          x2 = e.clientX;
          y2 = e.clientY;
          let deltaX = Math.abs(x2 - x1);
          let deltaY = Math.abs(x2 - x1);
          reCalc();
          if (deltaX > dragThreshold || deltaY > dragThreshold) dragging = true;
        }
      };
      onmouseup = (e) => {
        var offsetTop = media.offsetTop;
        var offsetLeft = media.offsetLeft;
        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
        scrollTop -= offsetTop;
        scrollLeft -= offsetLeft;
        selectionRect.hidden = 1;
        mousedown = false;
        if (dragging) {
          dragging = false;

          this.cropMedia(media, {
            left: parseInt(selectionRect.style.left, 10) + scrollLeft,
            top: parseInt(selectionRect.style.top, 10) + scrollTop,
            width: parseInt(selectionRect.style.width, 10),
            height: parseInt(selectionRect.style.height, 10)
          });
        }
      };
    }
  }

  cropMedia(media, {
    stretch = 1,
    left = 0,
    top = 0,
    width = 10,
    height = 10
  } = {}) {

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = width;
    croppedCanvas.height = height;
    croppedCanvas.getContext('2d').drawImage(media, left, top, width, height, 0, 0, width * stretch, height * stretch);
    this.emit('cropped', croppedCanvas);
    return croppedCanvas;
  }
}

import {
    EventEmitter
} from 'events';


import 'fabric';
const fabric = window['fabric'];

export default class MediaCropper extends EventEmitter {
    constructor(media) {

        super();

        if (!media) return;

        //if you provide media into the constuctor, you will be provided with a drag and drop seclection rectangle in your media

        const fabricHelperCanvas = document.createElement('canvas');

        fabricHelperCanvas.style.position = 'absolute';
        fabricHelperCanvas.style.height = '100%';
        fabricHelperCanvas.style.width = '100%';
        fabricHelperCanvas.style.top = 0;
        fabricHelperCanvas.style.left = 0;
        // fabricHelperCanvas.style.backgroundColor = 'green';
        // fabricHelperCanvas.style.opacity = 0.5;



        const croppingCanvas = document.createElement('canvas');

        //fix for wrong scaling (you need to define here the dimensions //TODO responsiveness
        croppingCanvas.height = media.clientHeight;
        croppingCanvas.width = media.clientWidth;


        croppingCanvas.style.position = 'absolute';
        // croppingCanvas.style.height = '100%';
        // croppingCanvas.style.width = '100%';
        croppingCanvas.style.top = 0;
        croppingCanvas.style.left = 0;
        // croppingCanvas.style.backgroundColor = 'green';
        // croppingCanvas.style.opacity = 0.5;


        //https://plainjs.com/javascript/manipulation/wrap-an-html-structure-around-an-element-28/
        // create wrapper container
        const wrapper = document.createElement('div');
        
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        
        // insert wrapper before media in the DOM tree
        media.parentNode.insertBefore(wrapper, media);
        
        // move el into wrapper
        wrapper.appendChild(media);

        wrapper.appendChild(croppingCanvas);
        wrapper.appendChild(fabricHelperCanvas);

        var fabricHelperCanvasHeight = fabricHelperCanvas.clientHeight;
        var fabricHelperCanvasWidth = fabricHelperCanvas.clientWidth;

        //fabric.js for dragging and scaling
        const canvas = new fabric.Canvas(fabricHelperCanvas, { selection: false });
        canvas.setHeight(fabricHelperCanvasHeight);
        canvas.setWidth(fabricHelperCanvasWidth);


        //drag new Rectangle
        // http://stackoverflow.com/a/24939023/1308461

        let rect, finalRect, isDown, rectDrawn, origX, origY;

        canvas.on('mouse:down', (o)=>{
            //if you click outside the rectangle, removeSelection
            if(rectDrawn && !o.target){
                removeSelection();
            }
            if(rectDrawn) return;
            isDown = true;
            let pointer = canvas.getPointer(o.e);
            origX = pointer.x;
            origY = pointer.y;
            pointer = canvas.getPointer(o.e);
            rect = new fabric.Rect({
                left: origX,
                top: origY,
                width: pointer.x-origX,
                height: pointer.y-origY,
                fill: 'rgba(255,255,255, 0.0)'
            });

            canvas.add(rect);
        });

        canvas.on('mouse:move', (o)=>{
            if (!isDown) return;
            const pointer = canvas.getPointer(o.e);

            if(origX>pointer.x){
                rect.set({ left: Math.abs(pointer.x) });
            }
            if(origY>pointer.y){
                rect.set({ top: Math.abs(pointer.y) });
            }

            rect.set({ width: Math.abs(origX - pointer.x) });
            rect.set({ height: Math.abs(origY - pointer.y) });

            canvas.renderAll();

            onChange({
                target : rect
            });
        });

        canvas.on('mouse:up', (o)=>{
            isDown = false;


            //replace with new rectangle, because the dragged one cannot be moved or scaled!!! why
            // ?!?!
            if(!rectDrawn) {
                finalRect = new fabric.Rect({
                    width: rect.getWidth(), height: rect.getHeight(), left: rect.getLeft(), top: rect.getTop(),
                    fill: 'rgba(255,255,255, 0.0)'
                });

                finalRect.lockRotation = true;
                finalRect.setControlsVisibility({
                    mtr: false
                });

                canvas.add(finalRect);
                canvas.remove(rect);
                canvas.setActiveObject(finalRect);

                rectDrawn = true;
            }


                //crop
                const offsetTop = media.offsetTop;
                const offsetLeft = media.offsetLeft;
                let scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
                let scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
                scrollTop -= offsetTop;
                scrollLeft -= offsetLeft;

                this.cropMedia(media, {
                    left: finalRect.getLeft() + scrollLeft,
                    top: finalRect.getTop() + scrollTop,
                    width: finalRect.getWidth(),
                    height: finalRect.getHeight()
                 });

        });




        //////////////////////////////////


        const canvasContainer = document.getElementsByClassName("canvas-container")[0];
         canvasContainer.style.position = 'absolute';
         canvasContainer.style.top = 0;
         canvasContainer.style.left = 0;


        canvas.on({
            'object:moving': onChange,
            'object:scaling': onChange
        });

        const context = croppingCanvas.getContext('2d');

        function onChange(options) {
            //redraw
            context.globalCompositeOperation="source-over";

            context.clearRect(0, 0, croppingCanvas.width, croppingCanvas.height);

            context.fillStyle='rgba(0,0,0,0.5)';
            context.fillRect(0,0, croppingCanvas.width, croppingCanvas.height);

            context.globalCompositeOperation="destination-out";

            context.fillStyle="rgba(255,255,255,1.0)";
            context.fillRect(options.target.getLeft(), options.target.getTop(), options.target.getWidth(), options.target.getHeight());
        }

        function removeSelection(){
            context.globalCompositeOperation="source-over";
            context.clearRect(0, 0, croppingCanvas.width, croppingCanvas.height);
            rectDrawn = false;
            canvas.remove(finalRect);
        }

    }

    cropMedia(media, {
        stretch = 1,
        left = 0,
        top = 0,
        width = 10,
        height = 10
    } = {}) {

        let result = {};

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = width;
        croppedCanvas.height = height;
        croppedCanvas.getContext('2d').drawImage(media, left, top, width, height, 0, 0, width * stretch, height * stretch);

        result.croppedCanvas = croppedCanvas;
        result.dimensions = {
            left, top, width, height
        }

        //if it is a video
        if(media.currentTime){
            result.currentTime = media.currentTime
        }

        this.emit('cropped', result);
        return result;
    }
}

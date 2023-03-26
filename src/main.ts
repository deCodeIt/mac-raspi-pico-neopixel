import { Readable } from "stream";
import screenshot from 'screenshot-desktop';
import getPixels from 'get-pixels';
import probe from 'probe-image-size';
import Jimp from 'jimp';

// Set the grid dimensions
const leftRows = 67;
const topColumns = 110;
const rightRows = 65;
const rightBoundary = 2 / 3;

// Capture a screenshot every second and process the grids
setInterval(() => {
  screenshot().then( ( img ) => {
    probe( Readable.from( img ) ).then(({ width, height }) => {
      Jimp.read(img).then((jimpImg) => {
        const leftGrid = jimpImg.crop(
          0,
          0,
          Math.floor(width * rightBoundary),
          height
        );
        const topGrid = jimpImg.crop(
          Math.floor(width * (1 - rightBoundary) / 2),
          0,
          Math.floor(width * rightBoundary),
          Math.floor(height / 3)
        );
        const rightGrid = jimpImg.crop(
          Math.floor(width * (1 - rightBoundary)),
          0,
          Math.floor(width * rightBoundary),
          height
        );

        getGridColors(leftGrid, leftRows, (leftArr: number[][]) => {
          getGridColors(topGrid, topColumns, (topArr: number[][]) => {
            getGridColors(rightGrid, rightRows, (rightArr: number[][]) => {
              const mergedArr = [...leftArr, ...topArr, ...rightArr];
              console.log(mergedArr);
            });
          });
        });
      });
    });
  }).catch((err) => {
    console.error(err);
  });
}, 1000);

// Get the aggregate color of each cell in a grid
const getGridColors = (
  grid: Jimp,
  cells: number,
  callback: (arr: number[][]) => void
): void => {
  grid.getBuffer(Jimp.MIME_PNG, (err: any, buffer: Buffer) => {
    if (err) {
      console.error(err);
      return;
    }

    getPixels(buffer, Jimp.MIME_PNG, (err: any, pixels: any) => {
      if (err) {
        console.error(err);
        return;
      }

      const arr: number[][] = [];

      for (let i = 0; i < cells; i++) {
        const start = Math.floor((i / cells) * (grid.bitmap.height - 1));
        const end = Math.floor(((i + 1) / cells) * (grid.bitmap.height - 1));
        const cellPixels = pixels.pick(
          null,
          null,
          null,
          null,
          { x: 0, y: start },
          { x: grid.bitmap.width - 1, y: end }
        ).data;
        const avg = getAverageColor(cellPixels);
        arr.push(avg);
      }

      callback(arr);
    });
  });
};

// Helper function to get the average color of a grid cell
const getAverageColor = (pixels: number[]): number[] => {
  let r = 0;
  let g = 0;
  let b = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
  }

  const numPixels = pixels.length / 4;
  return [Math.round(r / numPixels), Math.round(g / numPixels), Math.round(b / numPixels)];
};
import robot from 'robotjs';
import Jimp from 'jimp';

// Set the grid dimensions
// const leftRows = 67;
// const topColumns = 110;
// const rightRows = 65;

// Set init values;
const ss = robot.screen.capture();
const width = 256;
const height = Math.floor( width * ss.height / ss.width );

// Capture a screenshot every second and process the grids
const generateNewValue = async () => {
  const ss = robot.screen.capture();
  const jImg = new Jimp({data: ss.image, width: ss.width, height: ss.height});
  

  const jimpImg = jImg.resize( width, height );

  // Convert Image to Pixels.
  const imgPixels: number[][][] = new Array( width );
  jimpImg.scan( 0, 0, width, height, function ( x, y, idx ) {
    // console.log( `(${x}, ${y}), ${idx}` );
    if( y === 0 ) {
      // Initialize array for new column.
      imgPixels[ x ] = new Array( height );
    }
    // console.log( `(${x}, ${y}), ${idx} => ${imgPixels[ x ][ y ]}` );
    imgPixels[ x ][ y ] = [ this.bitmap.data[ idx + 0 ], this.bitmap.data[ idx + 1 ], this.bitmap.data[ idx + 2 ], this.bitmap.data[ idx + 3 ] ];
  } );
  // console.log( 'ImgPixels', imgPixels );
};

// Helper function to get the average color of a grid cell
// const getAverageColor = (pixels: number[]): number[] => {
//   let r = 0;
//   let g = 0;
//   let b = 0;

//   for (let i = 0; i < pixels.length; i += 4) {
//     r += pixels[i];
//     g += pixels[i + 1];
//     b += pixels[i + 2];
//   }

//   const numPixels = pixels.length / 4;
//   return [Math.round(r / numPixels), Math.round(g / numPixels), Math.round(b / numPixels)];
// };

const main = async () => {
  const start = new Date().getTime();
  let count = 0;
  while( count < 100 ) {
    count++;
    const elaspedTime = ( new Date().getTime() - start ) / 1000;
    if( elaspedTime > 0 ) {
      console.log( `Iterations / sec:  ${ Math.floor( count / elaspedTime ) }` )
    }
    await generateNewValue();
  }
};

main().finally( () => console.log( 'Done!' ) );
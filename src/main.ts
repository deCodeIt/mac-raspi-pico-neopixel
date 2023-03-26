import robot from 'robotjs';
import Jimp from 'jimp';

// Set the grid dimensions
const numLedsLeft = 67;
const numLedsTop = 110;
const numLedsRight = 65;

// Set init values;
const ss = robot.screen.capture();
const width = 128;
const height = Math.floor( width * ss.height / ss.width );
const topEnd = Math.floor( height / 3 );
const leftEnd = Math.floor( width / 3 );;
const rightStart = Math.floor( width * 2 / 3 );

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
  return processPixels( imgPixels );
};

const processPixels = async ( pixel: number[][][] ) => {
  // leftStrip
  const leftStrip = new Array( numLedsLeft );
  const heightPerLeftLed = height / numLedsLeft;
  for( let i = 0; i < numLedsLeft; i++ ) {
    leftStrip[ i ] = getAverageColor(
      pixel,
      0,
      heightPerLeftLed * i,
      leftEnd,
      heightPerLeftLed * ( i + 1 )
    );
  }
  // topStrip
  const topStrip = new Array( numLedsTop );
  const widthPerTopLed = height / numLedsTop;
  for( let i = 0; i < numLedsTop; i++ ) {
    topStrip[ i ] = getAverageColor(
      pixel,
      widthPerTopLed * i,
      0,
      widthPerTopLed * ( i + 1 ),
      topEnd
    );
  }
  // rightStrip
  const rightStrip = new Array( numLedsRight );
  const heightPerRightLed = height / numLedsRight;
  for( let i = 0; i < numLedsRight; i++ ) {
    rightStrip[ i ] = getAverageColor(
      pixel,
      rightStart,
      heightPerRightLed * i,
      width,
      heightPerRightLed * ( i + 1 )
    );
  }
}

// Helper function to get the average color of a grid cell
const getAverageColor = ( pixel: number[][][], x: number, y: number, xEmd: number, yEnd: number): number[] => {
  let r = 0;
  let g = 0;
  let b = 0;

  for( let i = 0; i < xEmd - x; i++ ) {
    for( let j = 0; j < yEnd - y; j++ ) {
      r += pixel[i][j][0];
      g += pixel[i][j][1];
      b += pixel[i][j][2];
    }
  }

  const numPixels = ( xEmd - x ) * ( yEnd - y );
  return [Math.round(r / numPixels), Math.round(g / numPixels), Math.round(b / numPixels)];
};

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
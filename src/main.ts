import robot from 'robotjs';
import Jimp from 'jimp';
import net from 'net';

const PORT = 8080;

const server = net.createServer((socket) => {
  console.log('Client connected');

  // Start sending LED updates.
  const asyncFn = async () => {
    while( !socket.closed ) {
      await generateNewValue( socket );
    }
  }
  asyncFn();

  socket.on('data', (data) => {
    console.log(`Received data: ${data}`);
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

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
const generateNewValue = async ( socket: net.Socket ) => {
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
  return processPixels( socket, imgPixels );
};

const processPixels = async ( socket: net.Socket, pixel: number[][][] ) => {
  // leftStrip
  const leftStrip = new Array<number[]>( numLedsLeft );
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
  const topStrip = new Array<number[]>( numLedsTop );
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
  const rightStrip = new Array<number[]>( numLedsRight );
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

  const finalLedColors = [
    ...leftStrip.reverse(),
    ...topStrip,
    ...rightStrip,
  ];

  encodeLedPixels( socket, finalLedColors );
}

const encodeLedPixels = ( socket: net.Socket, pixel: number[][] ) => {
  let msg = 'deaddeed'; // hex init
  for( let i = 0; i < pixel.length; i++ ) {
    msg += `${pixel[ i ][ 0 ].toString( 16 )}${pixel[ i ][ 2 ].toString( 16 )}${pixel[ i ][ 2 ].toString( 16 )}`;
  }
  msg += 'feedfeed';
  console.log( 'Msg', msg );
  socket.write( msg );
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

// const main = async () => {
//   const start = new Date().getTime();
//   let count = 0;
//   while( count < 100 ) {
//     count++;
//     const elaspedTime = ( new Date().getTime() - start ) / 1000;
//     if( elaspedTime > 0 ) {
//       console.log( `Iterations / sec:  ${ Math.floor( count / elaspedTime ) }` )
//     }
//     await generateNewValue();
//   }
// };

// main().finally( () => console.log( 'Done!' ) );
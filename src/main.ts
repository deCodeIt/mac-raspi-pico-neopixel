import robot from 'robotjs';
import Jimp from 'jimp';
import net from 'net';

const PORT = 8080;

const sleep = async ( durationInMs: number ) => {
  return new Promise( ( resolve ) => {
    setTimeout( () => {
      resolve( true );
    }, durationInMs );
  } );
}

const server = net.createServer((socket) => {
  console.log('Client connected');

  // Start sending LED updates.
  const asyncFn = async () => {
    while( !socket.closed ) {
      // await sleep( 1000 );
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
const partitionVertical = 10; // vertical lines to divide width
const partitionsHorizontal = 10; // horizontal lines to divide height

const sh_R = 8
const sh_G = 16
const sh_B = 0

// Capture a screenshot every second and process the grids
const generateNewValue = async ( socket: net.Socket ) => {
  const ss = robot.screen.capture();
  const jImgLeft = new Jimp({data: ss.image, width: ss.width, height: ss.height});
  const jImgTop = new Jimp({data: ss.image, width: ss.width, height: ss.height});
  const jImgRight = new Jimp({data: ss.image, width: ss.width, height: ss.height});
  
  // Create images so that we can extract the border pixels for each led strip thereby having jimp do the heavy lifting.
  const jimpImgLeft = jImgLeft.resize( partitionVertical, numLedsLeft, Jimp.RESIZE_NEAREST_NEIGHBOR );
  const jimpImgTop = jImgTop.resize( numLedsTop, partitionsHorizontal, Jimp.RESIZE_NEAREST_NEIGHBOR );
  const jimpImgRight = jImgRight.resize( partitionVertical, numLedsRight, Jimp.RESIZE_NEAREST_NEIGHBOR );

  // await jimpImgLeft.writeAsync( './myFileLeft.png' );
  // await jimpImgTop.writeAsync( './myFileTop.png' );
  // await jimpImgRight.writeAsync( './myFileRIght.png' );

  // Convert Image to Pixels.
  const leftStrip = new Array<number[]>( numLedsLeft );
  jimpImgLeft.scan( 0, 0, 1, numLedsLeft, function ( x, y, idx ) {
    // console.log( 'jimpImgLeft', x, y );
    leftStrip[ y ] = [ this.bitmap.data[ idx + 0 ], this.bitmap.data[ idx + 1 ], this.bitmap.data[ idx + 2 ], this.bitmap.data[ idx + 3 ] ];
  } );

  const topStrip = new Array<number[]>( numLedsTop );
  jimpImgTop.scan( 0, 0, numLedsTop, 1, function ( x, y, idx ) {
    // console.log( 'jimpImgTop', x, y );
    topStrip[ x ] = [ this.bitmap.data[ idx + 0 ], this.bitmap.data[ idx + 1 ], this.bitmap.data[ idx + 2 ], this.bitmap.data[ idx + 3 ] ];
  } );

  const rightStrip = new Array<number[]>( numLedsRight );
  jimpImgRight.scan( partitionVertical - 1, 0, 1, numLedsRight, function ( x, y, idx ) {
    // console.log( 'jimpImgRight', x, y );
    rightStrip[ y ] = [ this.bitmap.data[ idx + 0 ], this.bitmap.data[ idx + 1 ], this.bitmap.data[ idx + 2 ], this.bitmap.data[ idx + 3 ] ];
  } );

  const finalLedColors = [
    ...leftStrip.reverse(),
    ...topStrip,
    ...rightStrip,
  ];

  // console.log( 'finalLedColors', finalLedColors );
  encodeLedPixels( socket, finalLedColors );
};

const encodeLedPixels = ( socket: net.Socket, pixel: number[][] ) => {
  // console.log( 'encodeLedPixels', pixel, pixel.length );
  let msg = 'xxx'; // hex init
  for( let i = 0; i < pixel.length; i++ ) {
    // console.log( `pixel[${i}]: ${pixel[i]}` );
    const pixValue = pixel[ i ][ 2 ] << sh_B | pixel[ i ][ 0 ] << sh_R | pixel[ i ][ 1 ] << sh_G;
    // msg += `${pixel[ i ][ 0 ].toString( 16 )}${pixel[ i ][ 1 ].toString( 16 )}${pixel[ i ][ 2 ].toString( 16 )}`;
    msg += `${ i == 0 ? '' : ':' }${pixValue}`;
    // msg += '00ff00'; // Red
  }
  msg += 'yyy';
  console.log( 'Msg', msg );
  socket.write( msg );
};

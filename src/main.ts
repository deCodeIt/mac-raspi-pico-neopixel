import robot from 'robotjs';
import Jimp from 'jimp';
import net from 'net';

const PORT = 8181;

const sleep = async ( durationInMs: number ) => {
  return new Promise( ( resolve ) => {
    setTimeout( () => {
      resolve( true );
    }, durationInMs );
  } );
}

const server = net.createServer((socket) => {
  console.log('Client connected');
  const socketStatus = {
    closed: false,
  }

  socket.on('data', (data) => {
    console.log(`Received data: ${data}`);
    if( [ 'CONNECTED', 'DISPLAYED' ].includes ( data.toString() ) ) {
      generateNewValue( socket );
    }
  });

  socket.on('error', ( e ) => {
    socketStatus.closed = true
    console.log('Client error', e );
  });

  socket.on('end', () => {
    socketStatus.closed = true
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
const partitionVertical = 5; // vertical lines to divide width
const partitionsHorizontal = 6; // horizontal lines to divide height

const sh_R = 0
const sh_G = 16
const sh_B = 8

// Capture a screenshot every second and process the grids
const generateNewValue = async ( socket: net.Socket ) => {
  const ss = robot.screen.capture();
  const jImgLeft = new Jimp({data: ss.image, width: ss.width, height: ss.height});
  const jImgTop = new Jimp({data: ss.image, width: ss.width, height: ss.height});
  const jImgRight = new Jimp({data: ss.image, width: ss.width, height: ss.height});
  
  // Create images so that we can extract the border pixels for each led strip thereby having jimp do the heavy lifting.
  const jimpImgLeft = jImgLeft.resize( partitionVertical, numLedsLeft, Jimp.RESIZE_BILINEAR );
  const jimpImgTop = jImgTop.resize( numLedsTop, partitionsHorizontal, Jimp.RESIZE_BILINEAR );
  const jimpImgRight = jImgRight.resize( partitionVertical, numLedsRight, Jimp.RESIZE_BILINEAR );

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
  jimpImgTop.scan( 0, 1, numLedsTop, 1, function ( x, y, idx ) {
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
  let msg = 'deaddeed'; // hex init
  for( let i = 0; i < pixel.length; i++ ) {
    // console.log( `pixel[${i}]: ${pixel[i]}` );
    // const pixValue = pixel[ i ][ 2 ] << sh_B | pixel[ i ][ 0 ] << sh_R | pixel[ i ][ 1 ] << sh_G;
    const pixValue = `${pixel[ i ][ 0 ].toString( 16 ).padStart(2, '0')}${pixel[ i ][ 1 ].toString( 16 ).padStart(2, '0')}${pixel[ i ][ 2 ].toString( 16 ).padStart(2, '0')}`;
    // msg += `${pixel[ i ][ 2 ].toString( 16 )}${pixel[ i ][ 1 ].toString( 16 )}${pixel[ i ][ 0 ].toString( 16 )}`;
    msg += `${ i == 0 ? '' : ':' }${pixValue}`;
    // msg += '00ff00'; // Red
  }
  msg += 'feedfeed';
  console.log( 'Msg', msg );
  socket.write( msg );
};

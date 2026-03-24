const fs = require('fs');

try {
const buffer = fs.readFileSync('./public/models/VAT_Data.bin');
const data = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
const numVertices = 16224; // from VAT_Meta.json
const floatsPerFrame = numVertices * 4;

console.log('Total floats:', data.length);

let diffCount = 0;
for (let i = 0; i < floatsPerFrame; i++) {
   // Compare frame 0 with frame 100, 200, 400
   if (data[i] !== data[400 * floatsPerFrame + i]) {
       diffCount++;
   }
}

console.log('Number of different floats between frame 0 and frame 400:', diffCount);

if (diffCount === 0) {
   console.log('=> BAKER IS BROKEN: All frames are identical (T-Pose baked repeatedly)');
} else {
   console.log('=> APP IS BROKEN (OR SHADER ISSUE): Frames are different, VAT Data is beautifully animated!');
   console.log('Frame 0 vertex 0:', data[0], data[1], data[2]);
   console.log('Frame 400 vertex 0:', data[400*floatsPerFrame], data[400*floatsPerFrame+1], data[400*floatsPerFrame+2]);
}

} catch (e) {
  console.log('Error reading file:', e);
}

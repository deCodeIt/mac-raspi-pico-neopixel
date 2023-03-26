import * as robot from "robotjs";

const NUM_SCREENSHOTS = 100;

const start = process.hrtime();
for (let i = 0; i < NUM_SCREENSHOTS; i++) {
  const screenShot = robot.screen.capture(0, 0, robot.getScreenSize().width, robot.getScreenSize().height);
}
const end = process.hrtime(start);

const timeInSeconds = end[0] + end[1] / 1000000000;
const screenshotsPerSecond = NUM_SCREENSHOTS / timeInSeconds;

console.log(`Took ${timeInSeconds} seconds to take ${NUM_SCREENSHOTS} screenshots`);
console.log(`Average screenshots per second: ${screenshotsPerSecond.toFixed(2)}`);

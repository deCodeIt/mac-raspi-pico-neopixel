### A Workstation Ambience lighting system for MacOS with Raspberry Pi Pico W and NEOPIXEL RGS Strip.  

The software configures the Neopixel RGB strip with real-time updates to match Screen's colour pattern and thereby giving the feeling of an ambience lighting workstation.  

Steps Involved:
1. Establish a socket connection over WiFi for communication between MacOS and Raspberry Pi.  
2. The Program runs on MacOS and continuously takes low-resolution screenshots at speed to determine the current colour pattern.
3. It then encodes this data and sends it to the Raspberry Pi device via socket communication.  
4. The Raspberry Pi device then receives the data and decoded it.  
5. It uses the above data to configure the Neopixel strip with proper colour configuration.
6. Repeat Steps 2-5 till the program is terminated.

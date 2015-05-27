# Pond and sprinkler control using socketio es6 and angular2

Client app for pi circuit serving up on flask and socketio. Based upon github repos `ng2-play` and `angular2-authentication sample`

## Using it

This demo relies on a server running on a raspberry pi, https://github.com/mckennatim/cascada2pi. You'll need to clone it, run `npm install` then `npm start`. It will run a pi server on port 8087.

Then, you can run `npm install` and `npm start` on this project. `gulp watch`  will keep the dist(es5 version) updated. `gulp play` will do that plus run a http server on 3000` 

## System description

little app to communicate between browser/app and microcontroller to run a small waterfall

We have two little ponds in the yard fed by the rainwater from the roof. They are at the base of a big outcropping of roxbury pudding stone. Water is pumped from the lower pond to the upper pond and from the upper pond up the side of the ledge.

There is an app, "cascada" that starts the pumps and energizes the circuits to turn on the waterfall and control the level of the lower pond. 

If it hasn't rained in a while, over time water evaporates and leaks out. The level of the pond is controlled using a $10 lawn sprinkler relay to inject water into the pond when the falls below a certain level. Water gets added while the pumps are on until it reaches the max level then it goes off. If you turn on the pumps again it doesn't continue filling but waits to inject water til the water falls to the low water sensor. 

The water level control is independent of the pond timer, is located in its own circuit box on the porch and is activated whenever the waterfall is on.

The other circuit is connected to the house ethernet and contains a server, relays and timers to turn the system on and off. Its microcontroller is connected to an [[Enc28j60]] chip that implements a server capable of delivering GET string variables to the microcontroller. 

The app is written in HTML5/javascript, resides on http://cascada.sitebuilt.net and uses $.get to send a string to a php script on the that server which transfers it by curl to the external Enc28j60 server located in the house. It does this via a http://www.noip.com/ since the home network's IP can change. It tells the controller which circuit it wants on and for how long.


<br/><small>back to [[electronics]] [[projects in process]]</small>

==controlling the water level==

http://sitebuilt.net/images/water-control_circuit.JPG
:comparators - LM324N quad op amp
:flip flop - 74HC74AP dual D flip flop [http://sitebuilt.net/images/D-flipflop74HC74AP_pinnout.PNG pin-out]

The water level sensors are just thermostat wire. When immersed the resistance decreases to about 50K. Each sensor goes to a comparator. Comparators work in this setup by outputing LO if the minus input is a lower voltage than the +input and HI if the + input is higher. 

For the bottom sensor, the -input was hard wired with an even voltage divider that gave it 1/2 VCC. The +input had an uneven divider of 47K to VCC and 57K to GND when the sensor was out of water. More of the voltage dropped across the 57K than the 47K so the +input was higher than the -input and the output was HI. Submerging the sensor put approx 50K in parallel with the 57K so then the equiv resistance wasless than 47K so the -input is at a higher voltage and wins. The hi water sensor had a similar comparison.

The low level comparator goes HI when out of water and the high water sensor goes HI when immersed. The output of the low level comparator goes to the D input and the output of the high level comparator drives the clock. When the D flip flop output Q is HI the pump goes on.


http://sitebuilt.net/images/D-flipflop74HC74AP_truth.PNG
=====how the flip flop works=====
The flip flop was setup with <math>\overline{clr}</math> set to HI. Then, whenever a clock pulse goes HI, whatever is on the D input gets transferred to 'memory' and shows up on the Q output, EXCEPT, if <math>\overline{pre}</math> goes LO, it forces Q HI no matter what.  

http://sitebuilt.net/images/water-control_TRUTH.JPG
=====how this circuit works=====
loop
:The bottom sensor comparator is wired to the D and through a NOT gate to <math>\overline{pre}</math>. <math>\overline{pre}</math> forces Q HI when it is LO which only happens when the water level is below the low sensor. The HI turns the pump on.
======rising water======
:Once the water reaches the lower sensor and forces it LO that LO on D just hangs there waiting to be transferred by a rising clock pulse. That doesn't happen until the water rises sufficiently so the high sensor is immersed. Then it sends a rising pulse to the clock which puts what's on the D input on the Q output. In this case that is a LO. So the output goes LO and the pump goes off.

======falling water======
:When the water falls below the high limit sensor the pump stays off since when the high limit opens it sends the clock LO on a falling pulse which does not change Q (only a rising pulse does). So the pump stays off until it falls past the lower sensor. LOOP
loop
====revision====
After using for awhile I decide to change the function a bit. As designed, when the switch was thrown to run the circulation pumps if the state of things was between high and low water then D saw a LO, and Clk saw a LO. When you flipped the switch that state caused the pump to come on, ie be HI. I decided I didn't like that, I'd be filling the pond when I didn't really need to and end up wasting water.

So I had to change what happened on power up. If I could force a rising pulse on the clock I could drive it HI and since the lower sensor was LO it would transfer that LO from D to Q and keep the water relay off. Putting a capacitor between ground and the -input of the upper sensor comparator drove that pin to ground when the power came on (as the capacitor momentarily looked like a short) which sent a rising pulse to the CLK which transferred the LO on D to Q turning off the pump. When the capacitor charged then the -input went back to winning the comparison and sent the CLK LO which as we know has no effect on the Q output.
==the app==
Normally, the server serves up the webpages by loading the html and javascript to the client browser/app and responding to user input sent up from the client browser/app. A server running on a microcontroller can do that for very small and simple apps. Even loading images and script resources from somewhere else, microcontroller servers could quickly run out of memory and choke.

===system design with microcontrollers===
now using pi

<s>
microSERVER <- CURLonLAMPserver <-> CLIENTbrowser/app

Creating and interacting with the user interface happens from a regular LAMPserver which communicates with the microSERVER with some simple string (GET or JSON). But since the microSERVER is on a home network that likely has a dynamic IP that mighchosen t change anytime then you need to go through http://www.noip.com/

microSERVER <- no-ip.com <- CURLonLAMPserver <-> CLIENTbrowser/app

This application needs to switch on the chosen waterfall for a user-determined amount of time. The relays and the timers reside on the microSERVER. ?status=ON&relay=0&til=1 would turn ON relay 0 for 1 minute. Relay 0 is the waterfall. 

The server can also run and time two other relays. They are connected to other water valves in the yard. If you wanted to programmatically control a system to water your garden, for instance you could use the same microSERVER unchanged. The application would do all the calculations on which days and times the sprinklers should come on and just send a string to the microserver at the appropriate intervals. 

===[http://cascada.sitebuilt.net/files/relays3.ino the microcontroller code]===
The microcontroller endlessly loops. Each time it checks whether new packets have arrived and whether timers have expired. If they have their relays are turned off. 
<syntaxhighlight>
void loop() {
  word len = ether.packetReceive();
  word pos = ether.packetLoop(len);
 if (millis() > timer[0]) {
   digitalWrite(repin[0], reoff[0]);
 } 
  if (millis() > timer[1]) {
   digitalWrite(repin[1], reoff[1]);
 } 
  if (millis() > timer[2]) {
   digitalWrite(repin[2], reoff[2]);
 } 
</syntaxhighlight>

If a packet has arrived then the get string is read using the ether.findKeyVal() function of ethercard library. First it reads which 'relay' is to be controlled and then if it is to be turned ON then ether.findKeyVal() grabs the 'til' value.
<syntaxhighlight>
  if(pos) {
    char* data = (char *) Ethernet::buffer + pos;
    Serial.println(data); 
    ether.findKeyVal(data + 6, rel , sizeof rel , "relay");
    byte rela = atoi(rel);   
    Serial.println(rel); 
    if(strstr(data, "GET /?status=ON") != 0) {
      ether.findKeyVal(data + 6, til , sizeof til , "til");
</syntaxhighlight>
<syntaxhighlight>
</syntaxhighlight>

==development log==
====cascada 0.2 - http://10.0.1.186/?status=ON&til=1====
:next: 
[http://alanesq.com/arduino/ethernet_test.txt alanesq.com] uses findKeyVal
<syntaxhighlight>
  if(pos) {
    char* data = (char *) Ethernet::buffer + pos;
  Serial.println(data);    
  if(strstr(data, "GET /?status=ON") != 0) {
    ether.findKeyVal(data + 6, til , sizeof til , "til");
    Serial.print("Will stay on for ");
    Serial.print(til);
    Serial.println( " minutes.\n");
    int until = atoi(til);
    //Serial.println(until);    
    timer = millis() + until*60000;
...
</syntaxhighlight>
====cascada 0.1 - [[Enc28j60]], timer====
*simple timer
**setup
**loop
**:turn of ligth after 5 seconds
<syntaxhighlight>
...
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  
  timer = millis() + 5000;
}
void loop() {
    if (millis() > timer) {
      digitalWrite(RELAY_PIN, false);
    }     
}
</syntaxhighlight>

*Switched from wiznet shield to cheaper enc shield getting up to speed from [http://www.lucadentella.it/en/category/enc28j60-arduino/page/2/ lucandentella tutorials]

====cascada 0====
Click the button pump goes on in pond.

*send '1' to arduino, to tun on relay
*send '0' to arduino to turn off device
[http://www.instructables.com/id/Arduino-Ethernet-Shield-Tutorial/?ALLSTEPS Arduino-Ethernet-Shield-Tutorial]

====version 1====

====todo====

Pick up my phone, go to a web site, have there be a series of buttons on, off, 10, 20, 30, 60.

The idea was to automatically control the level of the pond by using a (cheap) lawn sprinkler relay to inject water into the pond when it falls below a critical level. Water gets added while the pumps are on until it reaches the max level then it goes off. If you turn on the pumps again it doesn't continue filling but waits to inject water til the water falls to the low water sensor. 

The buttons could be from a client side jquery-mobile page. Timing would seem suited to the server. Server would send an on message  and start a timer. After the time elapsed it would send an off message. Client would poll server to see what the status is and the time remaining.

Basic control is working in an outdoor circuit box mounted on the bridge next to the lawn sprinkler relay.</s>


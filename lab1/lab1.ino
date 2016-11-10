//Sally Lemkemeier
//Jimmy Carney

#include <SimbleeBLE.h>
#define ON_TIMER 1
#define OFF_TIMER 2

const int red_led = 2;
const int green_led = 3;
const int blue_led = 4;
const int button_a = 5;
const int button_b = 6;

bool state = false;
char red_value = 200;
char green_value = 200;
char blue_value = 200;
long on_timer = 0;
long off_timer = 0;
bool on_timer_state = false;
bool off_timer_state = false;
int fade_dur = 0;

//run once at start, sets base Simblee settings
void setup() {
  SimbleeBLE.advertisementData = "sally";

  Serial.begin(9600);

  pinMode(red_led, OUTPUT);
  pinMode(green_led, OUTPUT);
  pinMode(blue_led, OUTPUT);
  pinMode(button_a, INPUT);
  pinMode(button_b, INPUT);

  // start the BLE stack
  SimbleeBLE.begin();
}
//loops repeatedly, checking for button presses and decrementing timers
void loop() {
  if (digitalRead(button_a) == 1) {
    turnOn();
  }
  if (digitalRead(button_b) == 1) {
    turnOff();
  }
  //decrement all timers currnetly running
  if (on_timer_state == true && off_timer_state == true) {
    delay(1000);
    on_timer--;
    off_timer--;
  }
  else if (on_timer_state == true) {
    delay(1000);
    on_timer--;
    if (on_timer == 0) {
      turnOn();
      on_timer_state = false;
    }
  }
  else if (off_timer_state == true) {
    delay(1000);
    off_timer--;
    if (off_timer == 0) {
      turnOff();
      off_timer_state = false;
    }
  }
}
// set the amount of time in a timer
void setTime(int timer_type, int hours, int minutes, int seconds) {
  if (timer_type == OFF_TIMER) {
    off_timer = (hours * 3600) + (minutes * 60) + seconds;
  }
  else if (timer_type == ON_TIMER) {
    on_timer = (hours * 3600) + (minutes * 60) + seconds;
  }
}

//return the amount of time left in a timer
char* getTime(int timer_type) {
  if (timer_type == ON_TIMER) {
    char hours = (char)(on_timer / 3600);
    char minutes = (char)((on_timer / 60) + (on_timer % 3600));
    char seconds = (char)(on_timer % 60);
    char temp[4] = {(char)3, hours, minutes, seconds};
    return temp;
  }
  if (timer_type == OFF_TIMER) {
    char hours = (char)(off_timer / 3600);
    char minutes = (char)((off_timer / 60) + (off_timer % 3600));
    char seconds = (char)(off_timer % 60);
    char temp[4] = {(char)3, hours, minutes, seconds};
    return temp;
  }
}

//send rgb values
void sendRGB() {
  char temp[4] = {(char)2, red_value, green_value, blue_value};
  SimbleeBLE.send(temp, 4);
}

//send state of led (on/off)
void sendState() {
  if (state == true) {
    char temp[2] = {(char)1, (char)1};
    SimbleeBLE.send(temp, 2);
  }
  else {
    char temp[2] = {(char)1, (char)0};
    SimbleeBLE.send(temp, 2);
  }
}

//send time left in a timer
void sendTimer(int timer_type) {
  SimbleeBLE.send(getTime(timer_type), 4);
}

//turn on led
void turnOn() {
  state = true;
  analogWrite(red_led, red_value);
  analogWrite(green_led, green_value);
  analogWrite(blue_led, blue_value);
  sendState();
}

//turn off led
void turnOff() {
  state = false;
  analogWrite(red_led, 0);
  analogWrite(green_led, 0);
  analogWrite(blue_led, 0);
  sendState();
}

//fade led
void fade(char new_red, char new_green, char new_blue) {
  //calculate change per 1/100 second 

  if (fade_dur != 0){
    
    
    double red_diff = ((double) new_red - (double) red_value) / ((double) fade_dur * (double) 100);
    double green_diff = ((double)new_green - (double)green_value) / ((double) fade_dur * (double) 100);
    double blue_diff = ((double)new_blue - blue_value) / ((double)fade_dur * 100);

    int loops = 0;
    //while new values are not reached, increment each color
      while (loops < fade_dur * 100) {
        Serial.println(red_diff);
        analogWrite(red_led, red_value + loops * red_diff);
        analogWrite(green_led, green_value + loops * green_diff);
        analogWrite(blue_led, blue_value + loops * blue_diff);
        
       // red_value += red_diff * loops;
       // green_value += green_diff * loops;
      //  blue_value += blue_diff * loops;
        
        loops++;
        delay(10);
      }
    }

    
    analogWrite(red_led, new_red);
    analogWrite(green_led, new_green);
    analogWrite(blue_led, new_blue);
    
    red_value = new_red;
    green_value = new_green;
    blue_value = new_blue;
  
}

//upon receiving data, do the following:
void SimbleeBLE_onReceive(char data[], int len) {

  //set state
  if (data[0] == 1) {
    if (data[1] == 1) {
      turnOn();
    }
    if (data[1] == 0) {
      turnOff();
    }
  }
  //set rgb
  else if (data[0] == 2 && len == 4) {
    fade(data[1], data[2], data[3]);
    sendRGB();
  }
  //send state
  else if (data[0] == 3) {
    sendState();
  }
  //send rgb
  else if (data[0] == 4) {
    sendRGB();
  }
  //on timer
  else if (data[0] == 5) {
   
    //set time
    if (data[1] == 0) {
      int hours = (int)data[2];
      int minutes = (int)data[3];
      int seconds = (int)data[4];
      setTime(ON_TIMER, hours, minutes, seconds);
    }
    //start timer
    else if (data[1] == 1) {
      on_timer_state = true;
    }
    //get time left
    else if (data[1] == 2) {
      sendTimer(ON_TIMER);
    }
  }
   //off timer
  else if (data[0] == 6) {
    //set time
    if (data[1] == 0) {
      int hours = (int)data[2];
      int minutes = (int)data[3];
      int seconds = (int)data[4];
      setTime(OFF_TIMER, hours, minutes, seconds);
    }
    //start timer
    else if (data[1] == 1) {
      off_timer_state = true;
    }
    //get time left
    else if (data[1] == 2) {
      sendTimer(OFF_TIMER);
    }
  }
  //set fade
  else if (data[0] == 7) {
    fade_dur = (int)data[1];
  }
  //send fade duration
  else if (data[0] == 8) {
    char temp[] = {(char)4, (char)fade_dur};
    SimbleeBLE.send(temp, 2);
  }//set rgb dont fade
  else if (data[0] == 9){
    
    red_value = (char)data[1];
    green_value = (char)data[2];
    blue_value = (char)data[3];
  }

  
}


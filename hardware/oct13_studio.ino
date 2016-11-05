

#include <SimbleeBLE.h>

const int red = 2;
const int green = 3;
const int blue = 4;
int counter = 0;



void setup() {
  // Setup Hardware 
  pinMode(red, OUTPUT);
  pinMode(green, OUTPUT);
  pinMode(blue, OUTPUT);

  // Setup Serial for debugging
  Serial.begin(9600);
  Serial.println("Starting");

  // Setup BLE service
  SimbleeBLE.deviceName = "jimmy";
  SimbleeBLE.begin();
}

void loop() {
  SimbleeBLE.sendInt(counter);
  counter++;
  delay(1000);
}

void SimbleeBLE_onConnect()
{
  Serial.println("onConnect");
}

void SimbleeBLE_onDisconnect()
{
   Serial.println("onDisconnect");
}

void SimbleeBLE_onReceive(char data[], int len)
{
  Serial.println("onReceive");

  if(len==1) {
    if (data[0]) {
      Serial.println("Light ON");
      digitalWrite(red, HIGH);
    }
    else {
      Serial.println("Light OFF");
      digitalWrite(red, LOW);
      digitalWrite(green, LOW);
      digitalWrite(blue, LOW);
    }
  }
  if(len==3){
      analogWrite(red, data[0]);
      analogWrite(green, data[1]);
      analogWrite(blue, data[2]);
   }
  
}

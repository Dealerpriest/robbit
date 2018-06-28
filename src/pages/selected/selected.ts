import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BLE } from "@ionic-native/ble";

@IonicPage()
@Component({
  selector: "page-selected",
  templateUrl: "selected.html"
})
export class SelectedPage {
  setStatus: any;
  peripheral: any;
  connecteddd: boolean = false;
  uartService: any;
  uartRXCharacteristic: any;

  arrowLeftActive: boolean;
  aroowForwardActive: boolean;
  aroowRightActive: boolean;
  arrowBackwardActive: boolean;

  textEncoder = new TextEncoder();
  constructor(
    public navCtrl: NavController,
    private ble: BLE,
    public loading: LoadingController,
    public navParams: NavParams
  ) {
    let device = navParams.get("device");
    this.setStatus = "Shaking hand with " + device.name + " ID: " + device.id;
    // UUID ex. FF11 = 1 on && 0 off

    this.ble
      .connect(device.id)
      .subscribe(
        peripheral => this.onConnected(peripheral),
        peripheral => this.onDeviceDisconnected(peripheral)
      );
  }
  // Loader
  presentloading() {
    const loader = this.loading.create({
      content: "Ansluter till apparat",
      duration: 500
    });
    loader.present();
  }

  onConnected(peripheral) {
    this.presentloading();
    //alert("Handshake complete");
    this.peripheral = peripheral; // Peripheral is the slave && central master
    this.uartService = peripheral.services.find(element => {
      return element.includes("b5a");
    });

    console.log("uartservice:" + JSON.stringify(this.uartService));

    // var found = array1.find(function (element) {
    //   return element > 10;
    // });

    // this.uartService = peripheral.services[3]; // We think this is the uart service
    // Här behöver vi hitta rx charactericicsgrejimojen
    for (let i = 0; i < peripheral.characteristics.length; i++) {
      let currentCrtscs = peripheral.characteristics[i];
      if (currentCrtscs.service == this.uartService) {
        if (currentCrtscs.characteristic.includes("0003")) {
          console.log("Setting RX chracteristic!");
          this.uartRXCharacteristic = currentCrtscs.characteristic;
        }
        console.log(JSON.stringify(currentCrtscs));
      }
    }
    console.log(
      "RX characteristic: " + JSON.stringify(this.uartRXCharacteristic)
    );
    // this.uartRXCharacteristic =
    this.connecteddd = true;
    // console.log(JSON.stringify(peripheral));
  }

  onDeviceDisconnected(peripheral) {
    this.peripheral = undefined;
    alert("Handshake stopped");
    this.connecteddd = false;
  }

  // When user is leaving the selected page.
  ionViewWillLeave() {
    this.ble.disconnect(this.peripheral.id);
  }

  ionViewDidLeave() {
    this.peripheral = 0;
  }

  ionViewDidLoad() {
    setInterval(() => { 
      ///Let's here check if we should send drive stuff to the robot
      if()
     }, 100);
    this.presentloading();
    console.log("ionViewDidLoad SelectedPage");
  }

  send(msg) {
    console.log("gonna send BLE stuuufffzzz!");
    // let buffer = new Uint8Array([msg]).buffer;
    let buffer = this.textEncoder.encode(msg).buffer;
    this.ble.write(
      this.peripheral.id,
      this.uartService,
      this.uartRXCharacteristic,
      buffer
    );
  }

  forward() {
    var msg: string = "0\n";
    this.send(msg);
  }
  backward() {
    var msg: string = "1\n";
    this.send(msg);
  }
  left() {
    var msg: string = "3\n";
    this.send(msg);
  }
  right() {
    var msg: string = "2\n";
    this.send(msg);
  }
  stop() {
    var msg: string = "4\n";
    this.send(msg);
  }
}
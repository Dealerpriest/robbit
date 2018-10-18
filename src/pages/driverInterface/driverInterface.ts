import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform } from "ionic-angular";
import { LoadingController } from "ionic-angular";
// import { BleService } from "../../providers/bleservice/bleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
import nipplejs from "nipplejs";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import "webrtc-adapter";
// import encoding from 'text-encoding';

// @IonicPage()
@Component({
  selector: "page-driverInterface",
  templateUrl: "driverInterface.html"
})
export class DriverInterfacePage {
  peer: any;
  videoLinkActive: boolean = false;
  localStream: MediaStream;
  remoteStream: MediaStream;
  robotControlIntervalId: any;
  arrowLeftActive: boolean;
  arrowForwardActive: boolean;
  arrowRightActive: boolean;
  arrowBackwardActive: boolean;
  servoUpActive: boolean;
  servoDownActive: boolean;
  cameraOption: string = "constraint";
  SERVO_START_VALUE: number = 100;
  SERVO_MAX_VALUE: number = 155;
  SERVO_MIN_VALUE: number = 75;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    // public bleService: BleService,
    private socket: Socket,
    // private camera: Camera,
    private diagnostic: Diagnostic
  ) {
    socket.on("robotControl", msg => {
      // console.log("received socket msg: " + JSON.stringify(msg));
      // this.bleService.send(msg);
    });
  }

  // loggarn() {
  //   console.log(
  //     "Intervals are the same as a backwards clock. Thus its effeciency will be decesed."
  //   );
  // }

  //user is leaving the selected page.
  ionViewDidLeave() {
    clearInterval(this.robotControlIntervalId);

    this.peer.destroy();
    this.videoLinkActive = false;
  }

  ionViewDidEnter() {
    console.log("trying to fetch camera");
    this.checkNeededPermissions().then(() => {
      this.retrieveCamera();
    }).catch((err) => console.log("failed to get permissions: " + err));


    let leftMotor = 0;
    let rightMotor = 0;
    let options = {
      zone: document.getElementById("zone-joystick"),
      mode: 'static',
      position: {right: '50%', top: '50%'},
      color: 'white'
    };

    let manager = nipplejs.create(options);

    // TODO: design the interaction so that the joystick is for looking around rathjer than driving. Will need clever calculations/balancing between servo speed and motor speed to get smooth experience.

    manager
    .on("move", (evt, data) => {
      if (data.angle) {
        // // px, py are between max distance and -1 * max distans

        // let px = -Math.cos(data.angle.radian) * data.distance;
        // let py = Math.sin(data.angle.radian) * data.distance;

        // console.log("px: " + px);
        // console.log("py: " + py);
        // let JOYSTICK_MAX_DIST = 50;
        // let MOTOR_SCALE = 20;
        // // Source of algorithm:
        // // http://home.kendra.com/mauser/Joystick.html
        // // Calculate R+L (Call it V): V =(100-ABS(X)) * (Y/100) + Y
        // let v =
        //   (JOYSTICK_MAX_DIST - Math.abs(px)) * (py / JOYSTICK_MAX_DIST) +
        //   py;
        // // Calculate R-L (Call it W): W= (100-ABS(Y)) * (X/100) + X
        // let w =
        //   (JOYSTICK_MAX_DIST - Math.abs(py)) * (px / JOYSTICK_MAX_DIST) +
        //   px;
        // // Calculate R: R = (V+W) /2
        // rightMotor = (v + w) / 2;
        // // Calculate L: L= (V-W)/2
        // leftMotor = (v - w) / 2;
        // // Do any scaling on R and L your hardware may require.
        // rightMotor *= MOTOR_SCALE;
        // leftMotor *= MOTOR_SCALE;
        
        // Send those values to your Robot.
        console.log(" leftMotor:" + leftMotor + "rightMotor:" + rightMotor);
      }
    })
    .on("end", (evt, nipple) => {
      rightMotor = 0;
      leftMotor = 0;
      console.log("joystick released");
    });

    //TODO: Send robotcontrol over RTCDatachannel? As of now we're using the signaling socket. meh...
    let servo = this.SERVO_START_VALUE;
    console.log("ionViewWillEnter triggered");
    this.robotControlIntervalId = setInterval(() => {
      // let forwardAmt = 0;
      // let turnAmt = 0;
      // let motorValue1;
      // let motorValue2;
      // ///Let's check here if we are available to send drive instructions to selected robot.
      // if (this.arrowLeftActive) {
      //   turnAmt -= 1023;
      // }
      // if (this.arrowForwardActive) {
      //   forwardAmt += 1023;
      // }
      // if (this.arrowRightActive) {
      //   turnAmt += 1023;
      // }
      // if (this.arrowBackwardActive) {
      //   forwardAmt -= 1023;
      // }
      if (this.servoUpActive) {
        servo += 5;
      }
      if (this.servoDownActive) {
        servo -= 5;
      }
      servo = Math.max(this.SERVO_MIN_VALUE, Math.min(this.SERVO_MAX_VALUE, servo));
      // if (turnAmt == 0) {
      //   motorValue1 = forwardAmt;
      //   motorValue2 = forwardAmt;
      // } else {
      //   motorValue1 = forwardAmt / 2 + turnAmt / 2;
      //   motorValue2 = forwardAmt / 2 - turnAmt / 2;
      // }

      let leftMotorFloored = Math.floor(leftMotor);
      let rightMotorFloored = Math.floor(rightMotor);
      let msg =
        "" +
        rightMotorFloored +
        ";" +
        leftMotorFloored +
        ";" +
        servo +
        "\n";
      console.log("sending robot data to socket: " + msg);
      this.socket.emit("robotControl", msg);
    }, 300);
  }

  initiateCall() {
    console.log("starting call as initiator");
    this.peer = new Peer({ initiator: true, stream: this.localStream });
    this.peer.on("signal", data => {
      console.log("Driver got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });
    this.peer.on("stream", stream => {
      console.log("I am Driver and I am initiator. Received stream from listening peer");
      // got remote video stream, now let's show it in a video tag
      var video: any = document.querySelector("#driver-remote-video");
      video.srcObject = stream;
      // video.play();
    });
    this.peer.on('connect', () => {
      console.log('connection event!!!');
      this.videoLinkActive = true;
    });
  }

  changeCamera() {
    if (this.cameraOption == "environment") {
      this.cameraOption = "constraint";
    } else {
      this.cameraOption = "environment";
    }
    let video: HTMLVideoElement = document.querySelector("#driver-local-video");
    video.pause();
    this.retrieveCamera();
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: this.cameraOption }, audio: true })
      .then(stream => {
        console.log("Driver got local media as a stream");
        this.localStream = stream;
        let video: HTMLVideoElement = document.querySelector("#driver-local-video");
        video.srcObject = stream;
        video.volume = 0;
        // video.play();
      })
      .catch(err => {
        console.log("error: " + err);
      });
  }

  // permissionCheck(permission, name) {
  //   this.androidPermissions.checkPermission(permission).then(res => {
  //     console.log(name + " permission: " + res.hasPermission);
  //     if (!res.hasPermission) {
  //       return Promise.reject("no permission for " + name + "!");
  //     }
  //     return Promise.resolve();
  //   });
  // }

  checkNeededPermissions(){
    // let returnPromise = new Promise();
    if(this.diagnostic.isCameraAuthorized(false) && this.diagnostic.isMicrophoneAuthorized()){
      return Promise.resolve();
    }
    return Promise.reject("Camera and mic authorization promise rejected!");
  }

  ionViewDidLoad() {
    this.socket.on("signal", data => {
      console.log("Driver received signal message from socket");
      console.log(data);

      if(this.peer){
        this.peer.signal(data);
      }
    });
  }
}

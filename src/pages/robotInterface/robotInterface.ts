import { Component } from "@angular/core";
import { NavController, NavParams, Platform } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/bleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import "webrtc-adapter";
// import encoding from 'text-encoding';

@Component({
  selector: "page-robotInterface",
  templateUrl: "robotInterface.html"
})
export class RobotInterfacePage {
  peer: any;
  localStream: MediaStream;
  remoteStream: MediaStream;
  cameraOption: string = "constraint";
  videoLinkActive: boolean = false;
  videoVerticalFlipped: boolean = false;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    public bleService: BleService,
    private socket: Socket,
    // private camera: Camera,
    private diagnostic: Diagnostic
  ) {
    socket.on("robotControl", msg => {
      //console.log("received socket msg: " + JSON.stringify(msg));
      this.bleService.send(msg);
    });
    
    socket.on("signal", data => {
      console.log("Robot received signal message from socket");
      console.log(data);

      if(this.peer){
        this.peer.signal(data);
      }
    });
  }

  startWebRTCAndBLE() {
    console.log("Listening on calls!");
    this.bleService.start();
    this.initiateListen();
  }
  
  //user is leaving the selected page.
  ionViewWillLeave() {
    this.peer.destroy();
    this.videoLinkActive = false;
  }

  ionViewDidEnter() {
    console.log("Trying to fetch camera");
    this.checkNeededPermissions().then(() => {
      this.retrieveCamera().then( () => {
        this.startWebRTCAndBLE();
      });
    }).catch((err) => console.log("failed to get permissions: " + err));

   
    console.log("ionViewWillEnter triggered");
  }


  initiateListen() {
    this.peer = new Peer({
      initiator: false,
      stream: this.localStream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:54.197.33.120:3478",
            username: "greger",
            credential: "bajsmannen"
          }
        ]
      }
    });
    this.peer.on('signal', data => {
      console.log("Robot got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });
    this.peer.on('stream', stream => {
      console.log("I am Robot and I am listener. Received stream from initiating peer");
      // got remote video stream, now let's show it in a video tag
      let video: HTMLVideoElement = document.querySelector("#robot-remote-video");
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
    let video: HTMLVideoElement = document.querySelector("#robot-local-video");
    video.pause();
    this.retrieveCamera();
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    let promise = navigator.mediaDevices
      .getUserMedia({ video: { facingMode: this.cameraOption }, audio: true })
      .then(stream => {
        console.log("Robot got local media as a stream");
        this.localStream = stream;
        let video: HTMLVideoElement = document.querySelector("#robot-local-video");
        video.srcObject = stream;
        video.volume = 0;
        // video.play();
        return Promise.resolve();
      })
      .catch(err => {
        console.log("error: " + err);
        return Promise.reject(err);
      });
    return promise;
  }

  checkNeededPermissions(){
    // let returnPromise = new Promise();
    if(this.diagnostic.isCameraAuthorized(false) && this.diagnostic.isMicrophoneAuthorized()){
      return Promise.resolve();
    }
    return Promise.reject("Camera and mic authorization promise rejected!");
  }
}

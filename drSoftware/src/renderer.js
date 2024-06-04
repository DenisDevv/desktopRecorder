import './index.css';


import { ipcRenderer } from 'electron';
import { writeFile } from 'fs';

let mediaRecorder;
let recordedChunks = [];

const videoElement = document.querySelector('video');
const selectMenu = document.getElementById('selectMenu')
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
startBtn.onclick = e => {
  startRecording();
  stopBtn.disabled = false;
  startBtn.disabled = true;
  selectMenu.disabled = true;
};


stopBtn.onclick = e => {
  mediaRecorder.stop();
  stopBtn.disabled = true;
  startBtn.disabled = false;
  selectMenu.disabled = false;
};


selectMenu.onchange = () => {
  preview()
}
getVideoSources()
async function getVideoSources() {
  const inputSources = await ipcRenderer.invoke('getSources')
    inputSources.forEach(source => {
      const element = document.createElement("option")
      element.value = source.id
      element.innerHTML = source.name
      selectMenu.appendChild(element)
    });
    preview()
  }


async function startRecording() {
  
    const screenId = selectMenu.options[selectMenu.selectedIndex].value
    preview()
    const IS_MACOS = await ipcRenderer.invoke("getOperatingSystem") === 'darwin'
    const audio = !IS_MACOS ? {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    } : false
    const constraints = {
      audio,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenId
        }
      }
    };
  
    const stream = await navigator.mediaDevices
      .getUserMedia(constraints);
      videoElement.srcObject = stream;
    await videoElement.play();
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = stopRecording;
    mediaRecorder.start();
  }
async function preview() {
  const screenId = selectMenu.options[selectMenu.selectedIndex].value
  const IS_MACOS = await ipcRenderer.invoke("getOperatingSystem") === 'darwin'
    const audio = !IS_MACOS ? {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    } : false
    const constraints = {
      audio,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenId
        }
      }
    };
  
    const stream = await navigator.mediaDevices
      .getUserMedia(constraints);
    videoElement.srcObject = stream;
    await videoElement.play();
}
function onDataAvailable(e) {
    recordedChunks.push(e.data);
}


async function stopRecording() {
    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    });
  
    const buffer = Buffer.from(await blob.arrayBuffer());
    recordedChunks = []

    const { canceled, filePath } =  await ipcRenderer.invoke('showSaveDialog')
    if(canceled) return
  
    if (filePath) {
      writeFile(filePath, buffer);
    }
  }
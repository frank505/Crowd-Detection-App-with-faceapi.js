const MODEL_PATH = 'https://www.techbuildz.com/models';
const btnToBeginStream = document.querySelector('.video_stream_start');
const contentDiv = document.querySelector('.content-div');
const btnToEndStream = document.querySelector('.end_live_stream');
const video = document.querySelector("video");
let streamer = null;
let canvas = null;
let data = [];

btnToBeginStream.addEventListener('click',()=>
{
 let number =  window.prompt('Enter maximum number of persons allowed','');
 if(number == '' || number == null )
 {
    return alert('prompt input field cannot be empty');
 }


 if(isNaN(number))
 {
     return alert('only numeric values are allowed');
 }
 contentDiv.setAttribute('style','margin-top:600px');
 btnToBeginStream.disabled = true;
 btnToEndStream.disabled = false;
 localStorage.setItem('crowdLimit',number);
loadModelsAndStartVideo();
        
});

const loadModelsAndStartVideo = async() =>
{
    console.log('loading models');
    return Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH)
      ]).then(startVideo)
}



  
 

function startVideo() 
{
    const constraints = {
        video: true,
      };
      
      
   navigator.mediaDevices.getUserMedia(constraints).then((streamContent) => {
        video.srcObject = streamContent;
        streamer = streamContent;
      });
}

video.addEventListener('play', () => {
    
  canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    console.log(detections.length);
    const getCrowdLimit = localStorage.getItem('crowdLimit');
    if((getCrowdLimit!=null || getCrowdLimit!='') && (getCrowdLimit < detections.length))
    {
        let date = new Date();
        if(data.length == 0)
        {
            data.push({
                usersCount:detections.length,
                crowdLimit:getCrowdLimit,
                time: 'at '+date.getHours()+':'+date.getMinutes()+":"+date.getSeconds()+":"+
                date.getMilliseconds()+" at "+date.getDate()+"/"+
                (parseInt(date.getMonth())+1)+"/"+date.getFullYear()  
            });
        }else
        {
            let lastData = data[data.length - 1];
            if(lastData.usersCount!=detections.length)
            {
                data.push({
                    usersCount:detections.length,
                    crowdLimit:getCrowdLimit,
                    time: 'at '+date.getHours()+':'+date.getMinutes()+":"+date.getSeconds()+":"+
                    date.getMilliseconds()+" at "+date.getDate()+"/"+
                    (parseInt(date.getMonth())+1)+"/"+date.getFullYear()  
                });
            }
        }
   
                
       
        
    }
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 100)
})


btnToEndStream.addEventListener('click', ()=>
{
    localStorage.removeItem('crowdLimit');
   video.pause();
   video.src="";
   streamer.getTracks()[0].stop();
   document.body.removeChild(canvas); 
   contentDiv.setAttribute('style','margin-top:0px');
   this.disabled = false;
   btnToEndStream.disabled = true;
   let a = document.createElement('a');
   a.href = "data:application/octet-stream,"+encodeURIComponent(JSON.stringify(data));
   a.download = 'data.json';
   a.click();

})
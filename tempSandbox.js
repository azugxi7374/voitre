let _CONTEXT = {}
let _audioStream = null;
let _audioCtx = null;

const MIC_OPTIONS = {
    mimeType: 'audio/webm; codecs=opus'
};


async function sampleVisualize1() {
    const _canvas = document.querySelector(".visualizer");

    if (!_audioStream) {
        _audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    visualize(_audioCtx, _audioStream, _canvas);

    function visualize(audioCtx, stream, canvas) {
        const canvasCtx = canvas.getContext("2d");

        if (!audioCtx) {
            audioCtx = new AudioContext();
        }

        const source = audioCtx.createMediaStreamSource(stream);

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        draw();

        function draw() {
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;

            requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = "rgb(200, 200, 200)";
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = "rgb(0, 0, 0)";

            canvasCtx.beginPath();

            let sliceWidth = (WIDTH * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                let v = dataArray[i] / 128.0;
                let y = (v * HEIGHT) / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }
    }
}


async function sample2() {
    let audioStream = _audioStream;
    let audioCtx = _audioCtx;

    if (!audioStream) {
        _audioStream = audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    if (!audioCtx) {
        _audioCtx = audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(audioStream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    function upd() {
        analyser.getByteTimeDomainData(dataArray);
    }

    _CONTEXT.analyser = analyser
    _CONTEXT.dataArray = dataArray
    _CONTEXT.updateDataArray = upd
}

async function sample3() {
    const MIC_OPTIONS = {
        mimeType: 'audio/webm; codecs=opus'
    };
    if (!_audioStream) {
        _audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    const micRecorder = new MediaRecorder(_audioStream, MIC_OPTIONS);
    let micChunks = [];

    micRecorder.ondataavailable = function (evt) {
        console.log("type=" + evt.data.type + " size=" + evt.data.size);
        micChunks.push(evt.data);
    };

    micRecorder.onstart = () => {
        // micChunks = [];
    }
    micRecorder.onstop = function (evt) {
        // console.log(6)
        // micRecorder = null;
    }
    _CONTEXT.recorder = micRecorder
    _CONTEXT.data = micChunks
}

// memo
// TODO
async function sample4() {
    // copied
    await sample3()
    let rdr = _CONTEXT.recorder
    let rdata = _CONTEXT.data
    rdr.start(1000)
    // ↓[blob]
    let ab = await rdata[0].arrayBuffer()
    var audioCtx = new AudioContext()
    var d = await audioCtx.decodeAudioData(ab)
    d.getChannelData(0) // -> Float32Array
}

// ↓これだと失敗する。個別のblobを再生できないため。
async function sample5() {
    const MIC_OPTIONS = {
        mimeType: 'audio/webm; codecs=opus'
    };
    if (!_audioStream) {
        _audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    const rdr = new MediaRecorder(_audioStream, MIC_OPTIONS);
    let micChunks = [];
    _CONTEXT.chunks = micChunks

    // var audioCtx = new AudioContext()
    async function recodeCallback(blobData) {
        console.log({ blobData })
        _CONTEXT.blobData = blobData
        let ab = await blobData.arrayBuffer()
        console.log({ ab })
        _CONTEXT.ab = ab
        var audioCtx = new AudioContext()
        var d = await audioCtx.decodeAudioData(ab)
        console.log({ d })
        _CONTEXT.d = d
        const rms = calcRMS(d.getChannelData(0))
        const db = rmsTodB(rms)
        console.log({ rms, db })
    }
    rdr.ondataavailable = (evt) => {
        console.log("type=" + evt.data.type + " size=" + evt.data.size);
        micChunks.push(evt.data);
        recodeCallback(evt.data)
    };

    rdr.onstart = () => {
        // micChunks = [];
    }
    rdr.onstop = function (evt) {
        // console.log(6)
        // micRecorder = null;
    }

    rdr.start(10000)
    // ↓[blob]
}

// getByteTimeDomainDataを50ms?とかごとに呼び出して、非連続のスナップショットデータとして持つ案
async function sample6() {
    if (!_audioStream) {
        _audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    if (!_audioCtx) {
        _audioCtx = new AudioContext();
    }

    const source = _audioCtx.createMediaStreamSource(_audioStream);

    const analyser = _audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    source.connect(analyser);

    // [{time, db, fft?}
    const timesliceData = []
    const time0 = Date.now()

    function upd() {
        analyser.getFloatTimeDomainData(dataArray);
        const time = Date.now() - time0

        const rms = calcRMS(dataArray)
        const dB = Math.round(rmsTodB(rms))
        timesliceData.push({
            time, rms, dB
        })
    }
    function updAndOut() {
        upd();
        const dd = timesliceData[timesliceData.length - 1]
        console.log(dd.time, ":", dd.dB,)
    }
    var si = setInterval(updAndOut, 50)

    _CONTEXT.upd = upd;
    _CONTEXT.timesliceData = timesliceData;
    _CONTEXT.si = si;
}
// https://developer.mozilla.org/ja/docs/Web/API/AnalyserNode/getFloatFrequencyData
async function sample7() {
    const audioCtx = new AudioContext({ sampleRate: 8000 });

    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioSourceNode = audioCtx.createMediaStreamSource(audioStream);

    //Create analyser node
    const analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 4096// 256;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    //Set up audio node network
    audioSourceNode.connect(analyserNode);
    // analyserNode.connect(audioCtx.destination);

    //Create 2D canvas
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    function draw() {
        //Schedule next redraw
        requestAnimationFrame(draw);

        //Get spectrum data
        analyserNode.getFloatFrequencyData(dataArray);

        _CONTEXT.dataArray = dataArray;


        //Draw black background
        canvasCtx.fillStyle = "rgb(0, 0, 0)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        //Draw spectrum
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let posX = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] + 140) * 2;
            canvasCtx.fillStyle =
                "rgb(" + Math.floor(barHeight + 100) + ", 50, 50)";
            canvasCtx.fillRect(
                posX,
                canvas.height - barHeight / 2,
                barWidth,
                barHeight / 2,
            );
            posX += barWidth + 1;
        }
    }

    draw();
}

// freq
// function freq(i){return (i+1)*sampleRate/2/da.length}
// ↓ db合成
// 10 * Math.log10(da.reduce((sum,v)=> sum + Math.pow(10, v/10), 0))

// 音階計算。Aからの相対cent
// function calcScale(h){ const l = Math.log2(h/440); const normL = l-Math.floor(l); return normL*12}


function calcRMS(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
}
function rmsTodB(rms) {
    return 20 * Math.log10(rms);
}


function audioControler() {
    let audioStream = null;
    let micRecorder = null;
    let micChunks = [];


    // TODO
    const playbackMicTest = document.getElementById('playback_mictest');

    // TODO ???
    async function destroy() { }

    // fix. chunks
    async function createRecorder() {
        const MIC_OPTIONS = {
            mimeType: 'audio/webm; codecs=opus'
        };
        if (!audioStream || !micRecorder || !micChunks) {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            micRecorder = new MediaRecorder(audioStream, MIC_OPTIONS);
            micChunks = [];

            micRecorder.ondataavailable = function (evt) {
                console.log("type=" + evt.data.type + " size=" + evt.data.size);
                micChunks.push(evt.data);
            };

            micRecorder.onstop = function (evt) {
                // console.log(6)
                // micRecorder = null;
            }

            return { audioStream, micRecorder, micChunks };
        }
    }

    // マイクテスト再生
    // これはどちらかというとview
    function playMicTest(data, elem) {
        // Blobの作成
        const micBlob = new Blob(data, { type: "audio/webm" });
        // 再生できるようにURLを生成
        const micBlobUrl = window.URL.createObjectURL(micBlob);
        if (micBlobUrl) {
            elem.src = micBlobUrl;
            // 再生終了時
            elem.onended = function () {
                elem.pause();
                // elem.src = "";
            };
            // 再生
            elem.play();
        }
    };

    return {
        createRecorder,
        playMicTest,
        _getAudioStream: () => audioStream,
        _getMicRecorder: () => micRecorder,
        _getMicTestChunks: () => micChunks,
        _getPlaybackMicTest: () => playbackMicTest,
    }
}

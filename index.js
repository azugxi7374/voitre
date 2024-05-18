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

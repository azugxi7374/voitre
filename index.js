
function audioControler() {
    let micRecorder = null;

    let micTestChunks = [];

    // TODO
    const playbackMicTest = document.getElementById('playback_mictest');

    async function destroy() {
        // TODO ???
    }

    // fix. chunks
    async function createRecorder() {
        const MIC_OPTIONS = {
            mimeType: 'audio/webm; codecs=opus'
        };
        if (micRecorder) {
            return micRecorder;
        } else {

            const audioStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true
            });

            const micTestStream = new MediaStream();
            micTestStream.addTrack(audioStream.getAudioTracks()[0]);

            micRecorder = new MediaRecorder(micTestStream, MIC_OPTIONS);
            micTestChunks = [];

            micRecorder.ondataavailable = function (evt) {
                console.log("type=" + evt.data.type + " size=" + evt.data.size);
                micTestChunks.push(evt.data);
            };

            micRecorder.onstop = function (evt) {
                // console.log(6)
                // micRecorder = null;
            }
            return micRecorder;
        }
    }

    // function startRecording() {
    //     micRecorder.start(1000);
    //     console.log('start mic test');
    // }

    // function stopRecording() {
    //     if (micRecorder) {
    //         console.log(4)
    //         micRecorder.stop();
    //         console.log("stop mic test");
    //     }
    //     console.log(5)
    //     micRecorder.onstop = function (evt) {
    //         console.log(6)
    //         console.log('micTestRecorder.onstop(), so playback');
    //         micRecorder = null;
    //         playMicTest();
    //     };
    // }

    // マイクテスト再生
    function playMicTest(data, elem) {
        // Blobの作成
        const micTestBlob = new Blob(data, { type: "audio/webm" });
        // 再生できるようにURLを生成
        const micBlobUrl = window.URL.createObjectURL(micTestBlob);
        if (micBlobUrl) {
            elem.src = micBlobUrl;
            // 再生終了時
            elem.onended = function () {
                elem.pause();
                elem.src = "";
            };
            // 再生
            elem.play();
        }
    };

    return {
        createRecorder,
        playMicTest,
        _getMicRecorder: () => micRecorder,
        _getMicTestChunks: () => micTestChunks,
        _getPlaybackMicTest: () => playbackMicTest,
    }
}